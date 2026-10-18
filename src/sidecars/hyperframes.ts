/**
 * HyperFrames Motion Graphics & Animated Overlay Generator
 * Renders HTML, CSS & SVG animations into deterministic transparent video assets
 * for direct insertion onto FilmCraft timeline tracks (V2 / V3).
 */
export class HyperFramesEngine {
  /**
   * Generates a sleek, animated Lower Third graphic template with entrance/exit transitions.
   */
  public static generateLowerThird(
    primaryText: string,
    secondaryText: string,
    accentColor = "#8b5cf6"
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    overflow: hidden;
    background: transparent;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .container {
    position: absolute;
    bottom: 80px;
    left: 80px;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .accent-bar {
    width: 6px;
    background: ${accentColor};
    border-radius: 4px;
    margin-right: 16px;
  }
  .card {
    display: flex;
    background: rgba(18, 18, 22, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 28px;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  }
  .title {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .subtitle {
    color: #a1a1aa;
    font-size: 16px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="accent-bar"></div>
      <div>
        <div class="title">${primaryText}</div>
        <div class="subtitle">${secondaryText}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates a kinetic, centered Title Card with high-impact typography.
   */
  public static generateTitleCard(
    heading: string,
    subheading?: string,
    theme: "cyber" | "cinema" | "minimal" = "cinema"
  ): string {
    const bgGradient =
      theme === "cyber"
        ? "linear-gradient(135deg, #09090b 0%, #18181b 100%)"
        : theme === "cinema"
        ? "radial-gradient(circle at center, #1c1917 0%, #0c0a09 100%)"
        : "transparent";

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: ${bgGradient};
    color: #ffffff;
    font-family: 'Space Grotesk', -apple-system, sans-serif;
  }
  .hero {
    text-align: center;
    animation: zoomFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  h1 {
    font-size: 72px;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin: 0;
    text-transform: uppercase;
    background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 24px;
    color: #a855f7;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 16px;
  }
  @keyframes zoomFade {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
</style>
</head>
<body>
  <div class="hero">
    <h1>${heading}</h1>
    ${subheading ? `<p>${subheading}</p>` : ""}
  </div>
</body>
</html>`;
  }
}
