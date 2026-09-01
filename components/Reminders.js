"use client";
import { useEffect } from "react";

// Client-side reminders: works while the app/tab is open (and, on supported
// browsers/PWAs, even briefly in the background). A true always-on push
// reminder needs a mobile app or a server push service — flagging that as a
// bigger future step, not something a website alone can fully do.
export default function Reminders() {
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();

    checkYesterday();
    const interval = setInterval(() => {
      if (Notification.permission === "granted") {
        new Notification("Life Tracker", { body: "Quick check-in: log anything you've done this hour?" });
      }
    }, 60 * 60 * 1000); // hourly

    return () => clearInterval(interval);
  }, []);

  async function checkYesterday() {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const res = await fetch(`/api/timelog?date=${y.toISOString().slice(0, 10)}`);
    const data = await res.json();
    if (!data.day && Notification.permission === "granted") {
      new Notification("Life Tracker", { body: "You didn't log anything yesterday — want to fill it in?" });
    }
  }

  return null;
}
