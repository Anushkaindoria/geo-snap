import "./ProjectBanner.css";

type ProjectBannerProps = {
  overlay?: boolean;
};

// Shared project identity banner shown on both the map and upload form screens.
export function ProjectBanner({ overlay = false }: ProjectBannerProps) {
  return (
    <header className={`project-banner${overlay ? " project-banner--overlay" : ""}`}>
      <a
        className="project-banner__brand"
        href="https://www.haskoning.com/en"
        target="_blank"
        rel="noreferrer"
        aria-label="Open Haskoning website"
      >
        <img
          src="https://www.haskoning.com/-/media/project/common/haskoning-logo.svg"
          alt="Haskoning"
        />
      </a>

      <h1 className="project-banner__title">
        Comprehensive Flood Control Master Plan for Mumbai Suburban System of
        Western and Central Railway
      </h1>

      {/* Empty column balances the logo area and keeps the title visually centered. */}
      <span className="project-banner__balance" aria-hidden="true" />
    </header>
  );
}
