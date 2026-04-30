export function RateLimitGuard({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rate-limit" role="alert">
      {message}
    </div>
  );
}
