import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      username: user.username,
      photoUrl: user.photoUrl,
      remindersEnabled: user.remindersEnabled,
      remindDaysBefore: user.remindDaysBefore,
      remindHour: user.remindHour,
      remindHourMorning: user.remindHourMorning,
      remindHourAfternoon: user.remindHourAfternoon,
      remindHourEvening: user.remindHourEvening,
      reminderChannelConnected: user.reminderChannelConnectedAt !== null,
    },
  });
}
