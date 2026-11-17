"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 다른 선생님이 바꾼 상태가 보이도록 주기적으로, 그리고 화면에 다시 돌아올 때 새로 고친다. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);
  return null;
}
