"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks/use-api";
import { PublicPhotographer } from "@/lib/types/public";

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

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function BookPhotographerPage({
  params,
}: {
  params: Promise<{ photographerId: string }>;
}) {
  const router = useRouter();
  const { photographerId } = use(params);
  const submitRef = useRef(false);

  const [fromDate] = useState(() => localDateString(new Date()));
  const [toDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 90);
    return localDateString(end);
  });

  const { data: photographer, loading: photoLoading, error: photoError } =
    useApi<PublicPhotographer | null>(`/api/photographers/${photographerId}`);
  const availabilityUrl = photographer?.user_id
    ? `/api/availability?photographerId=${photographer.user_id}&from=${fromDate}&to=${toDate}`
    : "/api/availability?photographerId=00000000-0000-0000-0000-000000000000&from=2026-01-01&to=2026-01-02";
  const { data: slotsData, loading: slotsLoading, error: slotsError } = useApi<
    AvailabilitySlot[] | null
  >(availabilityUrl);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"error" | "success">("error");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => localDateString(new Date()).slice(0, 7));
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });

  const allSlots = useMemo(() => slotsLoading ? [] : (slotsData ?? []), [slotsData, slotsLoading]);
  const availableSlots = useMemo(
    () => allSlots.filter((s) => s.is_available && photographer?.is_available),
    [allSlots, photographer?.is_available]
  );
  const slotsForSelectedDate = useMemo(
    () => (selectedDate ? allSlots.filter((s) => s.available_date === selectedDate && s.is_available && photographer?.is_available) : []),
    [allSlots, selectedDate, photographer?.is_available]
  );

  const hasAvailability = availableSlots.length > 0;

  const { year, month } = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    return { year: y, month: m };
  }, [calendarMonth]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstDayOfMonth = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);
  const todayIso = localDateString(new Date());

  const availableDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSlots) {
      if (s.is_available) set.add(s.available_date);
    }
    return set;
  }, [allSlots]);

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
        availableSlots: allSlots.filter((s) => s.available_date === iso),
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
    return new Date(`1970-01-01T${time}`).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const submitBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitRef.current) return;
    submitRef.current = true;
    setBusy(true);
    setNotice("");
    if (!selectedSlot) {
      setNotice("Please select a time slot.");
      setNoticeType("error");
      setBusy(false);
      submitRef.current = false;
      return;
    }
    try {
      const generatedBookingNumber = `PSR-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photographerId: photographer?.user_id ?? photographerId,
          bookingNumber: generatedBookingNumber,
          title: formData.title || "Photography Session",
          description: formData.description || undefined,
          photographyType: "portrait",
          location: formData.location || "",
          bookingDate: selectedSlot.available_date,
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
          budget: undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error?.message || "Booking failed.");
      router.push(`/book/confirm/${generatedBookingNumber}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to book session.");
      setNoticeType("error");
      setBusy(false);
      submitRef.current = false;
    }
  };

  const canBook = !!selectedSlot && !!formData.title && !!formData.location && !busy;

  // Loading state
  if (photoLoading || slotsLoading) {
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

  // No availability at all
  if (!hasAvailability && !slotsLoading) {
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
          <EmptyState
            title="No availability"
            description={`${photographer.full_name} has no available time slots right now. Please check back later.`}
            action={{ label: "Browse photographers", href: "/book" }}
          />
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
                    disabled={calendarMonth === new Date().toISOString().slice(0, 7)}
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
                    className="p-2 rounded-[8px] border border-[rgba(255,255,255,0.13)] bg-transparent text-muted hover:text-white hover:border-orange transition-all"
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
                      className={`h-12 w-12 rounded-[8px] flex flex-col items-center justify-center text-xs transition-all ${
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
              <form onSubmit={submitBooking} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Session Title
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Portrait Session"
                    className="mb-0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Location
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Where should we meet?"
                    className="mb-0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Message to Photographer
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="What kind of photoshoot do you want?"
                    rows={3}
                    className="mb-0"
                  />
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
                    {busy ? "Sending Request…" : "Send Booking Request"}
                  </Button>
                  <p className="text-[10px] text-muted mt-2 text-center">
                    Your booking request will be reviewed by the photographer.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
