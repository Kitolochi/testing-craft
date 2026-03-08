/**
 * HTML page generators for accessibility testing demos.
 * Includes both accessible and inaccessible versions to show what axe catches.
 */

export function accessibleLoginForm(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Accessible</title>
  <style>
    body { font-family: system-ui; max-width: 400px; margin: 40px auto; padding: 0 20px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    label { font-weight: 500; color: #1f2937; }
    input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; }
    input:focus { outline: 2px solid #3b82f6; outline-offset: 2px; border-color: #3b82f6; }
    button { padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
    button:focus { outline: 2px solid #1d4ed8; outline-offset: 2px; }
    .error { color: #dc2626; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>Login</h1>
    <form aria-label="Login form">
      <div>
        <label for="email">Email address</label>
        <input type="email" id="email" name="email" required
               autocomplete="email"
               aria-describedby="email-hint">
        <small id="email-hint">We'll never share your email.</small>
      </div>
      <div>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required
               autocomplete="current-password"
               aria-describedby="password-req">
        <small id="password-req">Minimum 8 characters.</small>
      </div>
      <button type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`;
}

export function inaccessibleLoginForm(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
  <style>
    body { font-family: system-ui; max-width: 400px; margin: 40px auto; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; color: #ccc; }
    input { padding: 8px; border: 1px solid #eee; width: 100%; }
    .btn { padding: 10px 20px; background: #3b82f6; color: #93c5fd; border: none; }
    img { width: 100px; }
  </style>
</head>
<body>
  <div>
    <img src="logo.png">
    <div class="field">
      <span class="label">Email</span>
      <input type="text" placeholder="Enter email">
    </div>
    <div class="field">
      <span class="label">Password</span>
      <input type="text" placeholder="Enter password">
    </div>
    <div class="btn" onclick="login()">LOGIN</div>
  </div>
</body>
</html>`;
}
