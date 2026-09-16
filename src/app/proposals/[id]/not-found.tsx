import Link from "next/link";

export default function ProposalNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-navy-800">Request not found</h1>
      <p className="mt-2 text-navy-500">
        This request may have been removed, or the link might be incorrect.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to all requests
      </Link>
    </div>
  );
}
