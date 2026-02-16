import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Btn } from "../components/ui/Btn";
import { adminLogin, isAdminLoggedIn } from "../auth/adminAuth";

type LocationState = {
    from?: { pathname?: string; search?: string };
};

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectTo = useMemo(() => {
        const state = (location.state ?? {}) as LocationState;
        const pathname = state.from?.pathname ?? "/admin";
        const search = state.from?.search ?? "";
        return `${pathname}${search}`;
    }, [location.state]);

    useEffect(() => {
        setError(null);
    }, [username, password]);

    if (isAdminLoggedIn()) {
        return <Navigate to={redirectTo} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await adminLogin({ username, password });
            if (!res.success) {
                setError(res.message ?? "Login failed.");
                return;
            }
            navigate(redirectTo, { replace: true });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
                <div className="absolute top-24 right-[-120px] h-96 w-96 rounded-full bg-gradient-to-br from-brand/25 via-brand/10 to-transparent blur-3xl" />
                <div className="absolute bottom-[-140px] left-10 h-80 w-80 rounded-full bg-gradient-to-tr from-brand/18 via-transparent to-transparent blur-3xl" />
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-200 p-6">
                <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        Spelo Admin
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
                    <p className="text-sm text-slate-500">
                        Temporary local login until backend authentication is available.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Username or Email</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            placeholder="admin"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Password</label>
                        <Input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="rounded-xl"
                        />
                    </div>

                    {error ? (
                        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                            {error}
                        </div>
                    ) : null}

                    <Btn.Primary
                        type="submit"
                        disabled={submitting}
                        className="w-full justify-center rounded-xl"
                    >
                        {submitting ? "Signing in…" : "Sign in"}
                    </Btn.Primary>

                    <div className="text-xs text-slate-500">
                        Default credentials: <span className="font-semibold text-slate-700">admin / admin</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;

