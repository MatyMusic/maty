// src/components/auth/LoginForm.tsx
'use client'

export default function LoginForm() {
  return (
    <form
      className="grid gap-3 text-right"
      onSubmit={(e) => {
        e.preventDefault()
        alert('מחובר (דמו). בהמשך נחבר ל-NextAuth.')
      }}
    >
      <label className="grid gap-1">
        <span className="text-sm opacity-80">אימייל</span>
        <input required type="email" className="input-base input-ltr" inputMode="email" />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">סיסמה</span>
        <input required type="password" className="input-base input-ltr" />
      </label>

      <button className="btn mt-2">התחבר</button>
    </form>
  )
}
