export const base44 = {
  entities: {
    StudioBooking: {
      create: async (data) => {
        console.log("Booking payload:", data);
        return { success: true };
      },
    },
  },
};
