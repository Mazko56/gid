export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "gid-turysta-frontend",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
