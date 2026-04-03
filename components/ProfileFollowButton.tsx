/** Matches settings / onboarding (`SETTINGS_VERIFY_ICON`) */
const VERIFY_ICON = "/icons/nav/verify.svg?v=6";

type Props = {
  following: boolean;
  onToggle: () => void;
};

export function ProfileFollowButton({ following, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={following}
      className={`profile-follow-btn active:scale-[0.97] ${
        following ? "profile-follow-btn--following" : "profile-follow-btn--follow"
      }`}
    >
      <span className="profile-follow-btn__inner">
        <span className="profile-follow-btn__verify-wrap" aria-hidden>
          <img
            src={VERIFY_ICON}
            alt=""
            width={18}
            height={18}
            className="profile-follow-btn__verify"
            decoding="async"
          />
        </span>
        <span className="profile-follow-btn__label">{following ? "Following" : "Follow"}</span>
      </span>
    </button>
  );
}
