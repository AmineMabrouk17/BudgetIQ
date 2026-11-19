import Image from "next/image";
import type { Profile } from "@/lib/profiles";

const FALLBACK = "—";

export default function AdminUsersTable({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="overflow-hidden rounded-box border border-base-content/10 bg-base-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-base-content/60">
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="relative w-9 overflow-hidden rounded-full bg-base-200">
                        {profile.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.full_name ?? profile.email}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {profile.full_name ?? FALLBACK}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {profile.email}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {profiles.length === 0 ? (
              <tr>
                <td className="py-10 text-center text-sm text-base-content/40">
                  No registered users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
