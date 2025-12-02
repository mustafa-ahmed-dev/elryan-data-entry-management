export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "900px", width: "100%" }}>
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "48px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#1a202c",
                marginBottom: "16px",
              }}
            >
              Data Entry Quality Control System
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                color: "#718096",
                marginBottom: "32px",
              }}
            >
              Manage your data entry operations with quality assurance
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#1e40af",
                    marginBottom: "16px",
                  }}
                >
                  🎉 API System Ready!
                </h2>
                <p style={{ color: "#1e3a8a", marginBottom: "16px" }}>
                  Your API routes are now set up and ready to use.
                </p>
                <div
                  style={{
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "0.875rem",
                    color: "#1e40af",
                  }}
                >
                  <p>✅ Authentication API - Ready</p>
                  <p>✅ Users Management - Ready</p>
                  <p>✅ Schedules Workflow - Ready</p>
                  <p>✅ Entries Tracking - Ready</p>
                  <p>✅ Quality Evaluations - Ready</p>
                  <p>✅ Reports & Analytics - Ready</p>
                </div>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#166534",
                    marginBottom: "8px",
                  }}
                >
                  🚀 Test Your API
                </h3>
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.875rem",
                    marginBottom: "12px",
                  }}
                >
                  Run the test script to verify everything is working:
                </p>
                <code
                  style={{
                    display: "block",
                    background: "#dcfce7",
                    color: "#166534",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                  }}
                >
                  node test-api.js
                </code>
              </div>

              <div
                style={{
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  borderRadius: "8px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#6b21a8",
                    marginBottom: "8px",
                  }}
                >
                  📚 API Endpoints
                </h3>
                <div
                  style={{
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "0.875rem",
                    color: "#7c3aed",
                  }}
                >
                  <p>
                    <strong>Auth:</strong> /api/auth/[...nextauth]
                  </p>
                  <p>
                    <strong>Users:</strong> /api/users
                  </p>
                  <p>
                    <strong>Schedules:</strong> /api/schedules
                  </p>
                  <p>
                    <strong>Entries:</strong> /api/entries
                  </p>
                  <p>
                    <strong>Evaluations:</strong> /api/evaluations
                  </p>
                  <p>
                    <strong>Reports:</strong> /api/reports
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#92400e",
                    marginBottom: "8px",
                  }}
                >
                  👤 Admin Credentials
                </h3>
                <div
                  style={{
                    textAlign: "left",
                    fontSize: "0.875rem",
                    color: "#b45309",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <p>
                    <strong>Email:</strong> mustafa.ahmed@elryan.com
                  </p>
                  <p>
                    <strong>Password:</strong> Elryan@12345
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "32px",
                paddingTop: "32px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Next step: Build your frontend UI with Ant Design
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
