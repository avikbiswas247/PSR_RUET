"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks/use-api";
import { PublicPhotographer } from "@/lib/types/public";
import { PHOTOGRAPHY_SERVICES } from "@/lib/constants/booking";
import { dhakaDateString, formatDhakaDate, formatDhakaTime } from "@/lib/utils/dhaka-time";

interface AvailabilitySlot {
  id: string;
  photographer_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface CalendarDate {
  date: number;
  iso: string;
  isPast: boolean;
  isSelected: boolean;
  hasAvailability: boolean;
  isToday: boolean;
  availableSlots: AvailabilitySlot[];
}

function monthDateRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function isoDate(value: string | Date) {
  return String(value).slice(0, 10);
}

export default function BookPhotographerPage({
  params,
}: {
  params: Promise<{ photographerId: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { photographerId } = use(params);
  const submitRef = useRef(false);
  const currentMonth = dhakaDateString().slice(0, 7);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);
  const draftOwnerId = user?.id ?? null;
  const draftKey = draftOwnerId ? `psr-booking-draft:${draftOwnerId}:${photographerId}` : "";
  const { from: fromDate, to: toDate } = useMemo(() => monthDateRange(calendarMonth), [calendarMonth]);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  const { data: photographer, loading: photoLoading, error: photoError } =
    useApi<PublicPhotographer | null>(`/api/photographers/${photographerId}`);
  const availabilityUrl = photographer?.user_id
    ? `/api/availability?photographerId=${photographer.user_id}&from=${fromDate}&to=${toDate}`
    : "/api/availability?photographerId=00000000-0000-0000-0000-000000000000&from=2026-01-01&to=2026-01-02";
  const refreshedAvailabilityUrl = `${availabilityUrl}&refresh=${availabilityVersion}`;
  const { data: slotsData, loading: slotsLoading, error: slotsError } = useApi<
    AvailabilitySlot[] | null
  >(refreshedAvailabilityUrl);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [noticeType, setNoticeType] = useState<"error" | "success">("error");
  const [reviewing, setReviewing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadedDraftKey, setLoadedDraftKey] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    photographyType: "",
    customPhotographyDescription: "",
    budget: "",
  });
  const photographyService = formData.photographyType === "Other" && formData.customPhotographyDescription.trim()
    ? `Other: ${formData.customPhotographyDescription.trim().slice(0, 70)}`
    : formData.photographyType;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      if (!draftOwnerId || !draftKey) {
        setFormData({ title: "", description: "", location: "", photographyType: "", customPhotographyDescription: "", budget: "" });
        setSelectedSlot(null);
        setSelectedDate(null);
        setCalendarMonth(currentMonth);
        setLoadedDraftKey("");
        return;
      }

      try {
        const saved = sessionStorage.getItem(draftKey);
        if (saved) {
        try {
          const draft = JSON.parse(saved) as { version?: number; userId?: string | null; formData?: Partial<typeof formData>; selectedSlot?: AvailabilitySlot | null; selectedDate?: string | null };
          if (draft.version !== 1 || draft.userId !== draftOwnerId || !draft.formData || typeof draft.formData !== "object") throw new Error("Outdated booking draft");
          const stringField = (value: unknown) => typeof value === "string" ? value : "";
          setFormData({
            title: stringField(draft.formData.title),
            description: stringField(draft.formData.description),
            location: stringField(draft.formData.location),
            photographyType: stringField(draft.formData.photographyType),
            customPhotographyDescription: stringField(draft.formData.customPhotographyDescription),
            budget: stringField(draft.formData.budget),
          });
          if (draft.selectedSlot && typeof draft.selectedSlot.id === "string") setSelectedSlot(draft.selectedSlot);
          if (draft.selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(draft.selectedDate)) {
            setSelectedDate(draft.selectedDate);
            setCalendarMonth(draft.selectedDate.slice(0, 7));
          }
        } catch {
          sessionStorage.removeItem(draftKey);
        }
      }
      setLoadedDraftKey(draftKey);
      } catch {
        // Storage can be disabled by the browser. Booking should still work without draft persistence.
        setLoadedDraftKey(draftKey);
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [currentMonth, draftKey, draftOwnerId]);

  useEffect(() => {
    if (!draftOwnerId || !draftKey || loadedDraftKey !== draftKey) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ version: 1, userId: draftOwnerId, formData, selectedSlot, selectedDate }));
    } catch {
      // Draft persistence is optional; keep the interactive booking form usable.
    }
  }, [loadedDraftKey, draftKey, draftOwnerId, formData, selectedSlot, selectedDate]);

  const allSlots = useMemo(() => slotsLoading ? [] : (slotsData ?? []), [slotsData, slotsLoading]);
  const availableSlots = useMemo(
    () => allSlots.filter((s) => s.is_available),
    [allSlots]
  );
  const slotsForSelectedDate = useMemo(
    () => (selectedDate && photographer?.is_available !== false
      ? allSlots.filter((s) => isoDate(s.available_date) === selectedDate && s.is_available)
      : []),
    [allSlots, photographer?.is_available, selectedDate]
  );

  const hasAvailability = photographer?.is_available !== false && availableSlots.length > 0;

  const { year, month } = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    return { year: y, month: m };
  }, [calendarMonth]);

  const daysInMonth = useMemo(() => new Date(Date.UTC(year, month, 0)).getUTCDate(), [year, month]);
  const firstDayOfMonth = useMemo(() => new Date(Date.UTC(year, month - 1, 1)).getUTCDay(), [year, month]);
  const todayIso = dhakaDateString();
  const availableDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSlots) {
      if (s.is_available && photographer?.is_available !== false) set.add(isoDate(s.available_date));
    }
    return set;
  }, [allSlots, photographer?.is_available]);

  const calendarDates: CalendarDate[] = useMemo(() => {
    const dates: CalendarDate[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dates.push({ date: 0, iso: "", isPast: true, isSelected: false, hasAvailability: false, isToday: false, availableSlots: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = iso < todayIso;
      const hasAvailability = availableDatesSet.has(iso);
      dates.push({
        date: d,
        iso,
        isPast,
        isSelected: selectedDate === iso,
        hasAvailability,
        isToday: iso === todayIso,
        availableSlots: allSlots.filter((s) => isoDate(s.available_date) === iso),
      });
    }
    return dates;
  }, [year, month, daysInMonth, firstDayOfMonth, todayIso, availableDatesSet, allSlots, selectedDate]);

  const prevMonth = () => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const ny = m === 1 ? y - 1 : y;
    const nm = m === 1 ? 12 : m - 1;
    setCalendarMonth(`${ny}-${String(nm).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    setCalendarMonth(`${ny}-${String(nm).padStart(2, "0")}`);
  };

  const selectDate = (iso: string) => {
    setSelectedDate(iso);
    setSelectedSlot(null);
  };

  const selectSlot = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setSelectedDate(slot.available_date);
  };

  const formatTime = (time: string) => {
    return formatDhakaTime(time);
  };

  const formatDate = (iso: string) => {
    return formatDhakaDate(iso);
  };

  const reviewBooking = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot || !formData.title.trim() || !formData.description.trim() || !formData.photographyType) {
      setNotice("Choose a slot, session title, service, and booking message before reviewing.");
      setNoticeType("error");
      return;
    }
    if (formData.budget && (!Number.isFinite(Number(formData.budget)) || Number(formData.budget) < 0)) {
      setNotice("Enter a valid non-negative budget in BDT.");
      setNoticeType("error");
      return;
    }
    setNotice("");
    setReviewing(true);
  };

  const confirmBooking = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setBusy(true);
    setAuthRequired(false);
    setNotice("");
    if (!selectedSlot) {
      setNotice("Please select a time slot.");
      setNoticeType("error");
      setBusy(false);
      submitRef.current = false;
      return;
    }
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The service accepts either profile ID or photographer user ID and
          // resolves it against the active photographer profile on the server.
          photographerId,
          title: formData.title,
          description: formData.description,
          photographyType: photographyService,
          location: formData.location || null,
          bookingDate: isoDate(selectedSlot.available_date),
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
          budget: formData.budget ? Number(formData.budget) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) setAuthRequired(true);
        if (res.status === 409) {
          setAvailabilityVersion((version) => version + 1);
          setSelectedSlot(null);
          setReviewing(false);
        }
        throw new Error(json.error?.message || json.message || "Booking failed.");
      }
      const bookingNumber = json.data?.booking_number;
      if (!bookingNumber) throw new Error("The booking was saved but no confirmation number was returned. Please check My Bookings.");
      await fetch(availabilityUrl, { cache: "no-store" }).catch(() => null);
      if (draftKey) {
        try { sessionStorage.removeItem(draftKey); } catch { /* Ignore disabled browser storage. */ }
      }
      setAvailabilityVersion((version) => version + 1);
      router.push(`/book/confirm/${bookingNumber}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to book session.");
      setNoticeType("error");
      setBusy(false);
      submitRef.current = false;
    }
  };

  const canBook = !!selectedSlot && !!formData.title.trim() && !!formData.description.trim() && !!formData.photographyType && !busy;

  // Loading state
  if ((draftOwnerId ? loadedDraftKey !== draftKey : loadedDraftKey !== "") || photoLoading || slotsLoading) {
    return (
      <div className="min-h-[calc(100vh-92px)] bg-[#090909]">
        <div className="section-pad max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-[32px] tracking-tight font-bold text-white mb-1">Booking</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <div className="skeleton h-[64px] w-full rounded-[8px] mb-4" />
              <div className="skeleton h-5 mb-2 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <div className="skeleton h-[200px] w-full rounded-[8px] mb-4" />
              <div className="skeleton h-5 w-full mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photographer not found
  if (photoError || !photographer) {
    return (
      <div className="min-h-[calc(100vh-92px)] bg-[#090909] flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-[32px] tracking-tight font-bold text-white mb-4">Photographer Not Found</h1>
          <p className="text-muted text-lg mb-8">The photographer you&rsquo;re looking for doesn&rsquo;t exist.</p>
          <Link href="/book" className="text-orange font-bold hover:underline inline-flex items-center gap-1">
            &#8592; Browse photographers
          </Link>
        </div>
      </div>
    );
  }

  // Availability API error
  if (slotsError) {
    return (
      <div className="min-h-[calc(100vh-92px)] bg-[#090909]">
        <div className="section-pad max-w-[720px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-[32px] tracking-tight font-bold text-white mb-1">Book with {photographer.full_name}</h1>
              <p className="text-muted text-lg mb-8">Select an available time slot and confirm your booking.</p>
            </div>
            <Link href={`/photographers/${photographerId}`} className="text-sm text-orange font-bold hover:underline inline-flex items-center gap-1">
              &#8592; View profile
            </Link>
          </div>
          <div className="p-8 rounded-[14px] border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange text-sm text-center">
            {slotsError}
          </div>
        </div>
      </div>
    );
  }

  const noticeBox = notice ? (
    <div className={`p-4 rounded-[10px] mb-6 text-sm ${
      noticeType === "success"
        ? "border border-[rgba(34,197,94,0.2)] bg-[#1a2e1c]/40 text-[#4ade80]"
        : "border border-[rgba(233,93,8,0.2)] bg-[#2a1a0e]/30 text-orange"
    }`}>
      {notice}
    </div>
  ) : null;

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#090909]">
      <div className="section-pad max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[32px] tracking-tight font-bold text-white mb-1">Book a Photography Session</h1>
            <p className="text-muted text-sm">
              Choose a date and time, then confirm your booking request.
            </p>
            <p className="mt-1 text-xs text-muted">Calendar dates and session times use Dhaka local time (UTC+6).</p>
          </div>
        <Link href={`/photographers/${photographerId}`} className="text-xs font-bold text-orange hover:underline inline-flex items-center gap-1">
            &#8592; View profile
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-orange/20 bg-orange/5 text-orange text-[10px] font-bold">
            <span>1</span>
            <span className="ml-1">Photographer</span>
          </div>
          <div className="w-[16px] h-[1px] bg-[rgba(255,255,255,0.13)]" />
          <div className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-[rgba(255,255,255,0.13)] bg-[#111110] text-muted text-[10px] font-bold">
            <span>2</span>
            <span className="ml-1">Schedule</span>
          </div>
          <div className="w-[16px] h-[1px] bg-[rgba(255,255,255,0.13)]" />
          <div className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-[rgba(255,255,255,0.13)] bg-[#111110] text-muted text-[10px] font-bold">
            <span>3</span>
            <span className="ml-1">Confirm</span>
          </div>
        </div>

        {noticeBox}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column: Photographer summary + Calendar */}
          <div className="lg:col-span-7 space-y-8">
            {/* Photographer summary card */}
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {photographer.avatar_url ? (
                    <Image
                      src={photographer.avatar_url}
                      alt={photographer.full_name || "Photographer"}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover border border-[rgba(255,255,255,0.13)]"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#181817] flex items-center justify-center border border-[rgba(255,255,255,0.13)]">
                      <span className="text-sm font-bold text-muted">
                        {(photographer.full_name || "P").slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-white">{photographer.full_name}</h2>
                  {photographer.title && (
                    <span className="text-[10px] font-bold text-orange uppercase tracking-wider block mb-1">
                      {photographer.title}
                    </span>
                  )}
                  {photographer.location && (
                    <p className="text-sm text-muted flex items-center gap-1.5">
                      <span aria-hidden="true">&#127963;</span>
                      {photographer.location}
                    </p>
                  )}
                  {photographer.device && (
                    <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                      <span aria-hidden="true">&#128247;</span>
                      {photographer.device}
                    </p>
                  )}
                </div>
              </div>
              {photographer.bio && (
                <div className="p-4 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#181817] mb-6">
                  <p className="text-sm text-muted line-clamp-3">{photographer.bio}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.13)]">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Availability
                </p>
                <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                  photographer.is_available
                    ? "text-orange border border-orange/20 bg-orange/5"
                    : "text-muted border border-[rgba(255,255,255,0.13)] bg-transparent"
                }`}>
                  {photographer.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

            {/* Calendar */}
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-white">Choose a Date</h2>
                <div className="flex gap-2">
                  <button
                    onClick={prevMonth}
                    disabled={calendarMonth === currentMonth}
                    className="p-2 rounded-[8px] border border-[rgba(255,255,255,0.13)] bg-transparent text-muted hover:text-white hover:border-orange disabled:opacity-40 disabled:pointer-events-none transition-all"
                    aria-label="Previous month"
                  >
                    &#8592;
                  </button>
                  <span className="text-sm font-bold text-white">
                    {new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-[8px] border border-[rgba(255,255,255,0.13)] bg-transparent text-muted hover:text-white hover:border-orange disabled:opacity-40 disabled:pointer-events-none transition-all"
                    aria-label="Next month"
                  >
                    &#8594;
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-[10px] font-bold text-muted uppercase text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDates.map((d) => (
                  d.date === 0 ? (
                    <div key={`${year}-${month}-empty-${d.date}`} className="h-12" />
                  ) : (
                    <button
                      key={`${d.iso}`}
                      onClick={() => selectDate(d.iso)}
                      disabled={d.isPast || !d.hasAvailability}
                      className={`h-10 w-full min-w-0 rounded-[8px] flex flex-col items-center justify-center text-xs transition-all sm:h-12 ${
                        d.isSelected
                          ? "bg-orange text-[#14110f] font-bold"
                          : d.isPast || !d.hasAvailability
                          ? "bg-transparent text-[rgba(255,255,255,0.2)] pointer-events-none"
                          : d.isToday
                          ? "border border-orange/20 text-white"
                          : "bg-transparent text-muted hover:bg-[#181817] hover:text-white"
                      }`}
                      aria-label={formatDate(d.iso)}
                    >
                      <span className={d.isSelected ? "text-[#14110f]" : "inherit"}>{d.date}</span>
                      {d.isSelected && d.hasAvailability && (
                        <span className="mt-[2px] w-1 h-1 rounded-full bg-[#14110f]" />
                      )}
                    </button>
                  )
                ))}
              </div>
              {!hasAvailability && (
                <div className="mt-6 p-4 rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-[#181817] text-center">
                  <p className="text-sm text-muted">
                    No available dates in this month. Try another month.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Time slots + Booking form */}
          <div className="lg:col-span-5 space-y-8">
            {/* Time slots */}
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110] sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-white">Choose a Time</h2>
                {selectedDate && (
                  <span className="text-[10px] font-bold text-orange uppercase tracking-wider px-2 py-1 rounded-[8px] border border-orange/20 bg-orange/5">
                    {formatDate(selectedDate)}
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Skeleton variant="h2" className="w-3/4 mb-4" />
                  <Skeleton variant="line" className="w-full mb-2" />
                  <Skeleton variant="line" className="w-1/2" />
                </div>
              ) : slotsForSelectedDate.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  {selectedDate ? (
                    <>
                      <span className="text-2xl mb-4">&#128337;</span>
                      <h3 className="text-sm font-bold text-white mb-1">No time slots available</h3>
                      <p className="text-xs text-muted mb-6">Select another date to see available times.</p>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-xs font-bold text-orange hover:underline"
                      >
                        Choose another date
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mb-4">&#128337;</span>
                      <h3 className="text-sm font-bold text-white mb-1">Select a date</h3>
                      <p className="text-xs text-muted">Pick a date from the calendar to see available time slots.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slotsForSelectedDate.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => selectSlot(slot)}
                        disabled={!slot.is_available}
                        className={`h-12 rounded-[10px] border flex flex-col items-center justify-center gap-1 text-sm transition-all ${
                          isSelected
                            ? "bg-orange text-[#14110f] border-orange font-bold shadow-[0_0_24px_rgba(255,116,23,0.35)]"
                            : slot.is_available
                            ? "border-[rgba(255,255,255,0.13)] bg-[#181817] text-white hover:border-orange hover:bg-[#212120]"
                            : "border-[rgba(255,255,255,0.13)] bg-[#111110] text-[rgba(255,255,255,0.2)] pointer-events-none"
                        }`}
                      >
                        <span className="font-bold">{formatTime(slot.start_time)}</span>
                        <span className="text-[10px]">{formatTime(slot.end_time)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking form */}
            <div className="p-8 rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-[#111110]">
              <h2 className="text-[18px] font-bold text-white mb-6">Booking Details</h2>
              <form onSubmit={reviewBooking} className="space-y-5">
                {!reviewing ? <>
                <div>
                  <label htmlFor="photographyType" className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Photography service
                  </label>
                  <select
                    id="photographyType"
                    name="photographyType"
                    required
                    value={formData.photographyType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, photographyType: e.target.value }))}
                    className="w-full px-4 py-3 text-text border line-border rounded-sm bg-surface focus:border-orange focus:ring-1 focus:ring-orange/25 outline-none"
                  >
                    <option value="">Select a service</option>
                    {PHOTOGRAPHY_SERVICES.map((service) => <option key={service} value={service}>{service}</option>)}
                  </select>
                </div>
                {formData.photographyType === "Other" && <div><label htmlFor="customPhotographyDescription" className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted">Describe your service <span className="normal-case tracking-normal">(optional)</span></label><Input id="customPhotographyDescription" name="customPhotographyDescription" maxLength={70} value={formData.customPhotographyDescription} onChange={(event) => setFormData((previous) => ({ ...previous, customPhotographyDescription: event.target.value }))} placeholder="Briefly describe the photography service" className="mb-0" /></div>}
                <div>
                  <label htmlFor="sessionTitle" className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Session Title
                  </label>
                  <Input
                    id="sessionTitle"
                    name="title"
                    required
                    maxLength={120}
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Portrait Session"
                    className="mb-0"
                  />
                </div>
                <div>
                  <label htmlFor="sessionLocation" className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Session location <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <Input
                    id="sessionLocation"
                    name="location"
                    maxLength={240}
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Where should we meet?"
                    className="mb-0"
                  />
                </div>
                <div>
                  <label htmlFor="bookingMessage" className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Message to photographer <span aria-hidden="true">*</span>
                  </label>
                  <Textarea
                    id="bookingMessage"
                    name="description"
                    required
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the type of photography you need, expected number of photographs, preferred style, event details, and any special requirements."
                    rows={3}
                    className="mb-0"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted">{formData.description.length}/2,000</p>
                </div>
                <div>
                  <label htmlFor="proposedBudget" className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Proposed budget <span className="normal-case tracking-normal">(optional, BDT)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">৳</span>
                    <Input
                      id="proposedBudget"
                      name="budget"
                      type="number"
                      min="0"
                      max="1000000000"
                      step="1"
                      inputMode="decimal"
                      value={formData.budget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                      placeholder="Your proposed amount"
                      className="mb-0 pl-9"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">This is your proposed budget, not a confirmed quotation.</p>
                </div>
                <div className="pt-4 border-t border-[rgba(255,255,255,0.13)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center text-orange text-xs font-bold">
                        &#128247;
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">Selected Slot</p>
                        <p className="text-xs text-muted">
                          {selectedSlot && (
                            <>
                              {formatDate(selectedSlot.available_date)} &middot;{" "}
                              {formatTime(selectedSlot.start_time)} -{" "}
                              {formatTime(selectedSlot.end_time)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-lg font-bold tracking-wider"
                    disabled={!canBook}
                  >
                    Review booking
                  </Button>
                  <p className="text-[10px] text-muted mt-2 text-center">
                    The photographer must accept your request before it is confirmed.
                  </p>
                </div>
                </> : (
                  <div className="space-y-5" aria-live="polite">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange">Review your request</p>
                      <h3 className="mt-1 text-xl font-bold">{formData.title}</h3>
                      <p className="text-sm text-muted">{photographer.full_name} · {photographer.photography_genre || "Photographer"}</p>
                    </div>
                    <dl className="grid grid-cols-1 gap-3 rounded-sm border line-border bg-surface-2 p-4 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs uppercase tracking-wider text-muted">Service</dt><dd className="mt-1 font-medium">{photographyService}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wider text-muted">Date</dt><dd className="mt-1 font-medium">{selectedSlot ? formatDate(selectedSlot.available_date) : "Choose a slot"}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wider text-muted">Time</dt><dd className="mt-1 font-medium">{selectedSlot ? `${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)}` : "Choose a slot"}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wider text-muted">Location</dt><dd className="mt-1 font-medium">{formData.location || "To be arranged"}</dd></div>
                      <div><dt className="text-xs uppercase tracking-wider text-muted">Proposed budget</dt><dd className="mt-1 font-medium">{formData.budget ? `BDT ${Number(formData.budget).toLocaleString()}` : "Not specified"}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wider text-muted">Message</dt><dd className="mt-1 whitespace-pre-wrap font-medium">{formData.description}</dd></div>
                    </dl>
                    <p className="text-xs text-muted">Sending this request does not mean the photographer has accepted it. Your booking remains pending until they respond.</p>
                    {authRequired && <p className="rounded-sm border border-orange/30 bg-orange/5 p-3 text-sm text-orange">Sign in with a client account to send this request. Your booking details are saved on this device.</p>}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setReviewing(false)}>Edit booking</Button>
                      {authRequired ? (
                        <Link className="button button-primary flex-1 text-center" href={`/sign-in?next=${encodeURIComponent(`/book/${photographerId}`)}`}>Sign in to continue</Link>
                      ) : (
                        <Button type="button" variant="primary" className="flex-1" onClick={confirmBooking} disabled={busy || !selectedSlot}>
                          {busy ? "Sending request…" : "Send Booking Request"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
