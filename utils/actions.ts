"use server";

import {
  createReviewSchema,
  imageSchema,
  profileSchema,
  propertySchema,
  validateWithZod,
} from "./schemas";
import db from "./db";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "./supabase";
import { calculateTotals } from "./calculateTotals";
import { formatDate } from "@/utils/format";

// error helper function
const getError = (error: unknown): { message: string } => {
  console.log(error);
  return {
    message: error instanceof Error ? error.message : "An error occurred",
  };
};

// get the current user from clerk
export const getAuthUser = async () => {
  // user from clerk
  const user = await currentUser();
  if (!user) {
    throw new Error("User not logged in");
  }
  if (!user.privateMetadata.hasProfile) redirect("/profile/create");
  return user;
};

// Creates a new profile .
export const createProfileAction = async (
  prevState: any,
  formData: FormData
) => {
  try {
    // Get the current user from clerk
    const user = await currentUser();
    if (!user) throw new Error("Please login to create a profile");
    if (user?.privateMetadata?.hasProfile) redirect("/");

    // console.log(user);
    //get user input
    const rawData = Object.fromEntries(formData);
    // Validate the user input
    const validatedData = validateWithZod(profileSchema, rawData);

    // Create a profile for the user
    await db.profile.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        profileImage: user.imageUrl ?? "",
        ...validatedData,
      },
    });
    // Update user metadata to indicate profile creation
    await clerkClient.users.updateUserMetadata(user.id, {
      privateMetadata: {
        hasProfile: true,
      },
    });

    // Revalidate the path to trigger profile update
    revalidatePath("profile");
    // return { message: `Profile created!` };
  } catch (error: any) {
    return {
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
  redirect("/");
};

// fetch the profile image
export const fetchProfileImageAction = async () => {
  // Get the current user from clerk
  const user = await currentUser();
  if (!user) return null;

  // Fetch the profile image
  const profile = await db.profile.findUnique({
    where: {
      clerkId: user.id,
    },
    select: {
      profileImage: true,
    },
  });
  return profile?.profileImage;
};

// fetch the profile
export const fetchProfileAction = async () => {
  const user = await getAuthUser();

  const profile = await db.profile.findUnique({
    where: { clerkId: user.id },
  });

  if (!profile) return redirect("/profile/create");
  return profile;
};

// update the profile
export const updateProfileAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  // Get the current user
  const user = await getAuthUser();

  try {
    const rawData = Object.fromEntries(formData);

    const validatedData = validateWithZod(profileSchema, rawData);
    // console.log(validatedData);

    await db.profile.update({
      where: { clerkId: user.id },
      data: validatedData,
    });

    revalidatePath("profile");
    return { message: "Profile updated successfully" };
  } catch (error) {
    return getError(error);
  }
};

// update the profile image
export const updateProfileImageAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser();
  try {
    const image = formData.get("image") as File;
    const validatedData = validateWithZod(imageSchema, { image });
    // get the path of the image
    const fullPath = await uploadImage(validatedData.image);
    // update the profile image
    await db.profile.update({
      where: { clerkId: user.id },
      data: { profileImage: fullPath },
    });
    revalidatePath("/profile");
    return { message: "Profile image updated successfully" };
  } catch (error) {
    return getError(error);
  }
};

// create a new property
export const createPropertyAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser();
  // console.log("formData: ", formData);
  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get("image") as File;

    const validatedData = validateWithZod(propertySchema, rawData);

    const validatedFile = validateWithZod(imageSchema, { image: file });

    const fullPath = await uploadImage(validatedFile.image);

    await db.property.create({
      data: {
        ...validatedData,
        image: fullPath,
        profileId: user.id,
      },
    });
  } catch (error: any) {
    return getError(error);
  }
  redirect("/");
};

// fetch properties:
export const fetchPropertiesAction = async ({
  search = "",
  category,
}: {
  search?: string;
  category?: string;
}) => {
  const properties = await db.property.findMany({
    where: {
      category,
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      tagline: true,
      country: true,
      image: true,
      price: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return properties;
};

// fetch property details by id
export const fetchPropertyDetailsAction = async (id: string) => {
  // Fetch the property by id
  return await db.property.findUnique({
    where: { id },
    include: {
      profile: true,
      bookings: {
        select: {
          checkIn: true,
          checkOut: true,
        },
      },
    },
  });
};

// fetch favorite
export const fetchFavoriteIdAction = async ({
  propertyId,
}: {
  propertyId: string;
}) => {
  // Get the current user
  const user = await getAuthUser();

  // Fetch the favorite by propertyId and user id
  const favorite = await db.favorite.findFirst({
    where: {
      propertyId,
      profileId: user.id,
    },
    select: {
      id: true,
    },
  });

  return favorite?.id || null;
};

// toggle favorite
export const toggleFavoriteAction = async (prevState: {
  propertyId: string;
  favoriteId: string | null;
  pathname: string;
}) => {
  // Get the current user
  const user = await getAuthUser();
  const { propertyId, favoriteId, pathname } = prevState;

  // toggle the favorite in the database
  try {
    if (favoriteId) {
      // Remove the favorite
      await db.favorite.delete({
        where: { id: favoriteId },
      });
    } else {
      // Add the favorite
      await db.favorite.create({
        data: {
          propertyId,
          profileId: user.id,
        },
      });
    }
    revalidatePath(pathname);
    return { message: favoriteId ? "Favorite removed" : "Favorite added" };
  } catch (error) {
    return getError(error);
  }
};

// fetch favorites
export const fetchFavoritesAction = async () => {
  const user = await getAuthUser();

  // Fetch the favorites by user id
  const favorites = await db.favorite.findMany({
    where: {
      profileId: user.id,
    },
    // get connected property
    select: {
      property: {
        select: {
          id: true,
          name: true,
          tagline: true,
          price: true,
          country: true,
          image: true,
        },
      },
    },
  });
  return favorites.map((favorite) => favorite.property);
};

// create review
export const createReviewAction = async (
  prevState: any,
  formData: FormData
) => {
  const user = await getAuthUser();
  // console.log("formData: ", formData);

  try {
    const rawData = Object.fromEntries(formData);

    const validatedData = validateWithZod(createReviewSchema, rawData);

    // console.log("validatedData ", validatedData);

    await db.review.create({
      data: {
        ...validatedData,
        profileId: user.id,
      },
    });
    revalidatePath(`/properties/${validatedData.propertyId}`);
    return { message: "Review submitted successfully" };
  } catch (error) {
    return getError(error);
  }
};

// fetch property reviews
export const fetchPropertyReviewsAction = async (propertyId: string) => {
  const reviews = await db.review.findMany({
    where: {
      propertyId,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      profile: {
        select: {
          firstName: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return reviews;
};

export const fetchReviewsByUserAction = async () => {
  const user = await getAuthUser();
  const reviews = await db.review.findMany({
    where: {
      profileId: user.id,
    },

    // get connected property
    select: {
      id: true,
      rating: true,
      comment: true,
      property: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });
  return reviews;
};

export const deleteReviewAction = async (prevState: { reviewId: string }) => {
  const { reviewId } = prevState;
  const user = await getAuthUser();

  try {
    await db.review.delete({
      where: {
        id: reviewId,
        profileId: user.id,
      },
    });

    revalidatePath("/reviews");
    return { message: "Review deleted" };
  } catch (error) {
    return getError(error);
  }
};

// fetch ratings
export const fetchRatingAction = async (propertyId: string) => {
  const result = await db.review.groupBy({
    by: ["propertyId"],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
    where: {
      propertyId,
    },
  });
  // console.log('result', result);
  return {
    rating: result[0]?._avg.rating?.toFixed() ?? 0,
    count: result[0]?._count.rating ?? 0,
  };
};

// find review by user id and property id
export const findReviewAction = async (userId: string, propertyId: string) => {
  const review = await db.review.findFirst({
    where: {
      profileId: userId,
      propertyId,
    },
  });
  return review;
};

// create booking
export const createBookingAction = async (prevState: {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
}) => {
  const user = await getAuthUser();
  const { propertyId, checkIn, checkOut } = prevState;
  let bookingId: null | string = null;

  // delete previous bookings with paymentStatus false
  await db.booking.deleteMany({
    where: {
      profileId: user.id,
      paymentStatus: false,
    },
  });

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { price: true },
  });

  if (!property) {
    return { message: "Property not found" };
  }

  const { orderTotal, totalNights } = calculateTotals({
    price: property.price,
    checkIn,
    checkOut,
  });

  try {
    const booking = await db.booking.create({
      data: {
        checkIn,
        checkOut,
        orderTotal,
        totalNights,
        profileId: user.id,
        propertyId,
      },
    });
    bookingId = booking.id;
  } catch (error) {
    return getError(error);
  }
  // redirect to checkout
  redirect(`/checkout?bookingId=${bookingId}`);
};

// fetch bookings
export const fetchBookingsAction = async () => {
  const user = await getAuthUser();
  const bookings = await db.booking.findMany({
    where: {
      profileId: user.id,
      paymentStatus: true,
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          country: true,
        },
      },
    },
    orderBy: {
      checkIn: "desc",
    },
  });
  return bookings;
};

// delete booking
export const deleteBookingAction = async (prevState: { bookingId: string }) => {
  const { bookingId } = prevState;
  const user = await getAuthUser();

  try {
    await db.booking.delete({
      where: {
        id: bookingId,
        profileId: user.id,
      },
    });

    revalidatePath("/bookings");
    return { message: "Booking deleted" };
  } catch (error) {
    return getError(error);
  }
};

// fetch rentals
export const fetchRentalsAction = async () => {
  const user = await getAuthUser();
  const rentals = await db.property.findMany({
    where: {
      profileId: user.id,
    },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });

  const rentalSum = await Promise.all(
    rentals.map(async (rental) => {
      const totalNightsSum = await db.booking.aggregate({
        where: {
          propertyId: rental.id,
          paymentStatus: true,
        },
        _sum: {
          totalNights: true,
        },
      });

      const orderTotalSum = await db.booking.aggregate({
        where: {
          propertyId: rental.id,
          paymentStatus: true,
        },
        _sum: {
          orderTotal: true,
        },
      });

      return {
        ...rental,
        totalNightsSum: totalNightsSum._sum.totalNights,
        orderTotalSum: orderTotalSum._sum.orderTotal,
      };
    })
  );
  return rentalSum;
};

// delete rental
export const deleteRentalAction = async (prevState: { propertyId: string }) => {
  const { propertyId } = prevState;
  const user = await getAuthUser();

  try {
    await db.property.delete({
      where: {
        id: propertyId,
        profileId: user.id,
      },
    });

    revalidatePath("/rentals");
    return { message: "Rental deleted" };
  } catch (error) {
    return getError(error);
  }
};

// fetch rental by propertyId and user id
export const fetchRentalByIdAction = async (propertyId: string) => {
  const user = await getAuthUser();

  const rental = await db.property.findUnique({
    where: {
      id: propertyId,
      profileId: user.id,
    },
  });

  return rental;
};

// update rental
export const updatePropertyAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser();
  const propertyId = formData.get("id") as string;

  try {
    const rawData = Object.fromEntries(formData);
    const validatedData = validateWithZod(propertySchema, rawData);

    await db.property.update({
      where: {
        id: propertyId,
        profileId: user.id,
      },
      data: {
        ...validatedData,
      },
    });

    revalidatePath(`/rentals/${propertyId}/edit`);
    return { message: "Rental updated" };
  } catch (error) {
    return getError(error);
  }
};

// update rental image
export const updatePropertyImageAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser();
  const propertyId = formData.get("id") as string;

  try {
    const image = formData.get("image") as File;
    const validatedData = validateWithZod(imageSchema, { image });
    // get the url of the image from supabase
    const fullPath = await uploadImage(validatedData.image);

    await db.property.update({
      where: {
        id: propertyId,
        profileId: user.id,
      },
      data: {
        image: fullPath,
      },
    });
    revalidatePath(`/rentals/${propertyId}/edit`);
    return { message: "Image updated" };
  } catch (error) {
    return getError(error);
  }
};

// fetch reservations
export const fetchReservationsAction = async () => {
  const user = await getAuthUser();

  const reservations = await db.booking.findMany({
    where: {
      paymentStatus: true,
      property: {
        profileId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          price: true,
          country: true,
        },
      },
    },
  });
  return reservations;
};

// fetch admin:
const getAdminUser = async () => {
  const user = await getAuthUser();
  if (user.id !== process.env.ADMIN_USER_ID) redirect("/");
  return user;
};

// fetch stats:
export const fetchStatsAction = async () => {
  await getAdminUser();

  const usersCount = await db.profile.count();
  const propertiesCount = await db.property.count();
  const bookingsCount = await db.booking.count({
    where: {
      paymentStatus: true,
    },
  });

  return { usersCount, propertiesCount, bookingsCount };
};

// fetch charts action
export const fetchChartsAction = async () => {
  await getAdminUser();

  // get the date six months ago
  const date = new Date();
  const sixMonthsAgo = new Date(date.setMonth(date.getMonth() - 6));

  const bookings = await db.booking.findMany({
    where: {
      paymentStatus: true,
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // bookings per month
  const bookingsPerMonth = bookings.reduce(
    (acc: Array<{ date: string; count: number }>, booking) => {
      const date = formatDate(booking.createdAt, true);

      const existing = acc.find((item) => item.date === date);

      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    },
    []
  );
  return bookingsPerMonth;
};

// fetch reservation stats
export const fetchReservationStatsAction = async () => {
  const user = await getAuthUser();

  const properties = await db.property.count({
    where: {
      profileId: user.id,
    },
  });

  const totals = await db.booking.aggregate({
    _sum: {
      orderTotal: true,
      totalNights: true,
    },
    where: {
      property: {
        profileId: user.id,
      },
    },
  });

  return {
    properties,
    nights: totals._sum.totalNights || 0,
    amount: totals._sum.orderTotal || 0,
  };
};
