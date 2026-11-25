import Image from "next/image";

interface TechItem {
  name: string;
  logo: string;
}

const verifiedTechStack: readonly TechItem[] = [
  { name: "Next.js", logo: "/images/techstack/nextjs.svg" },
  { name: "React", logo: "/images/techstack/react.svg" },
  { name: "TypeScript", logo: "/images/techstack/typescript.svg" },
  { name: "Tailwind CSS", logo: "/images/techstack/tailwindcss.svg" },
  { name: "Node.js", logo: "/images/techstack/nodejs.svg" },
  { name: "JavaScript", logo: "/images/techstack/javascript.svg" },
  { name: "HTML5", logo: "/images/techstack/html5.svg" },
  { name: "CSS3", logo: "/images/techstack/css3.svg" },
  { name: "PHP", logo: "/images/techstack/php.svg" },
  { name: "MySQL", logo: "/images/techstack/mysql.svg" },
] as const;

export function TechnologyStack({
  title = "Teknologi yang kami gunakan.",
}: {
  title?: string;
}) {
  return (
    <section className="tech-stack-section" aria-labelledby="tech-stack-heading">
      <div className="page-container">
        <div className="tech-stack-layout">
          <h2 id="tech-stack-heading" className="tech-stack-heading">
            {title}
          </h2>

          <ul className="tech-stack-grid" aria-label="Daftar teknologi modern">
            {verifiedTechStack.map((tech) => (
              <li key={tech.name} className="tech-marquee-item">
                <span className="tech-logo-box">
                  <Image
                    src={tech.logo}
                    alt=""
                    width={22}
                    height={22}
                    className="tech-logo-img"
                    loading="eager"
                  />
                </span>
                <span className="tech-logo-label">{tech.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
