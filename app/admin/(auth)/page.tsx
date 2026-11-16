"use client";

import { BrandLogo } from "@/components/layout/brand-logo";
import Link from "next/link";

export default function AdminEntryPage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center px-6">
      <div className="max-w-[480px] w-full">
        <div className="p-8 rounded-[16px] border border-[rgba(255,255,255,0.13)] bg-[#111110] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.55)]">
          <div className="mb-8 flex justify-center"><BrandLogo height={48} preload className="psr-brand-logo-on-dark" /></div>
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-muted text-sm mb-8">
            PSR administration
          </p>
          <div className="space-y-3">
            <Link
              href="/admin/register"
              className="button button-primary w-full py-4 text-lg font-bold tracking-tight"
            >
              Register as Administrator
            </Link>
            <Link
              href="/admin/login"
              className="button button-outline w-full py-4 text-lg font-bold tracking-tight"
            >
              Admin Sign In
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.13)]">
            <Link href="/" className="button button-outline text-sm w-full">
              Return to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
