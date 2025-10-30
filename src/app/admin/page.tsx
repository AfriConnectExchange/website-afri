export default function AdminPage() {
  // Intentionally minimal: the admin root acts as an auth gate. Layout handles
  // redirect to login/session checks. Keep the page blank to avoid leaking
  // main-site UI or content. (You can add widgets here later.)
  return <div aria-hidden="true" />;
}
