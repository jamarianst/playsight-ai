import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="app-footer">
      <small>PlaySight AI — Pro-level game analysis from your phone.</small>
      <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
        <Link to="/">Upload</Link>
        {" · "}
        <Link to="/analysis/demo">Demo</Link>
      </p>
    </footer>
  );
}
