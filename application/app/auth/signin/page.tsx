"use client"
import { useRef, useState } from "react"

const icons = {
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
    mail: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />,
    lock: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />,
    eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></>,
    eyeOff: <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />,
}

function Icon({ name, className }: { name: keyof typeof icons, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className ?? ""}`}>{icons[name]}</svg>
}

function Field({ name, label, icon, type = "text", autoComplete }: { name: string, label: string, icon: keyof typeof icons, type?: string, autoComplete?: string }) {
    const [show, setShow] = useState(false)
    const isPassword = type === "password"
    return <div className="group relative">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-0 blur-md transition duration-300 group-focus-within:opacity-50" />
        <div className="relative flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur transition duration-300 hover:border-zinc-700 group-focus-within:border-emerald-400/60">
            <Icon name={icon} className="ml-4 shrink-0 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
            <div className="relative flex-1">
                <input
                    id={name}
                    name={name}
                    type={isPassword && show ? "text" : type}
                    autoComplete={autoComplete}
                    placeholder=" "
                    className="peer w-full bg-transparent px-3 pt-6 pb-2 text-zinc-100 outline-none"
                />
                <label
                    htmlFor={name}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all duration-200 peer-focus:top-3.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-wider peer-focus:text-emerald-400 peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-wider"
                >
                    {label}
                </label>
            </div>
            {isPassword && <button
                type="button"
                onClick={() => setShow(s => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="mr-3 grid place-items-center w-9 h-9 rounded-xl text-zinc-500 transition hover:bg-zinc-800 hover:text-emerald-400 cursor-pointer"
            >
                <Icon name={show ? "eyeOff" : "eye"} />
            </button>}
        </div>
    </div>
}

export default function Signin(){
    const formRef = useRef<HTMLFormElement>(null)
    return <div className="min-h-screen w-full grid lg:grid-cols-2 bg-zinc-950 text-zinc-100">
        <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-zinc-900">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px]" />
            <span className="relative text-sm font-mono tracking-widest text-emerald-400">// PORTFOLIO</span>
            <div className="relative">
                <h2 className="text-5xl font-extrabold leading-tight">
                    Start building<br />something <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">great.</span>
                </h2>
                <p className="mt-4 max-w-sm text-zinc-400">Create your account in less than a minute.</p>
            </div>
            <span className="relative text-xs text-zinc-500">© {new Date().getFullYear()}</span>
        </aside>
        <main className="flex items-center justify-center px-6 py-16">
            <form className="w-full max-w-sm flex flex-col gap-7" ref={formRef} onSubmit={(e)=>{
                e.preventDefault()
            }}>
                <div>
                    <span className="text-xs font-mono tracking-widest text-emerald-400 lg:hidden">// PORTFOLIO</span>
                    <h1 className="mt-2 text-4xl font-bold">Sign In</h1>
                    <p className="mt-2 text-sm text-zinc-400">Create a new account.</p>
                </div>
                <div className="flex flex-col gap-4">
                    <Field name="user_name" label="User Name" icon="user" autoComplete="username" />
                    <Field name="email" label="Email" icon="mail" type="email" autoComplete="email" />
                    <Field name="password" label="Password" icon="lock" type="password" autoComplete="new-password" />
                    <Field name="c_password" label="Confirm Password" icon="lock" type="password" autoComplete="new-password" />
                </div>
                <button
                    type="submit"
                    className="group mt-2 flex items-center justify-between rounded-full bg-emerald-400 pl-6 pr-2 py-2 font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98] cursor-pointer"
                >
                    Sign In
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-zinc-950 text-emerald-400 transition-transform group-hover:translate-x-1">→</span>
                </button>
                <p className="text-sm text-zinc-400">
                    Already have an account? <a href="/auth/login" className="font-semibold text-zinc-100 underline decoration-emerald-400 decoration-2 underline-offset-4 hover:text-emerald-400">Log In</a>
                </p>
            </form>
        </main>
    </div>
}
