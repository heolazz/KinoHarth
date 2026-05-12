import { getAiringSchedule } from "@/services/anilist";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    start?: number;
    end?: number;
  };
  const { start, end } = body;

  if (
    typeof start !== "number" ||
    typeof end !== "number" ||
    !Number.isInteger(start) ||
    !Number.isInteger(end)
  ) {
    return Response.json(
      { error: "Invalid schedule range." },
      { status: 400 }
    );
  }

  const data = await getAiringSchedule({
    page: 1,
    perPage: 50,
    airingAtGreater: start,
    airingAtLesser: end,
  });

  return Response.json({
    schedules: data.Page?.airingSchedules || [],
  });
}
