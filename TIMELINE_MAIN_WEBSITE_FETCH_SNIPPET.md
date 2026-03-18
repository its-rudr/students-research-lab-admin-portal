# Main Website Timeline Fetch Snippet

Use this in your main website Timeline component to fetch timeline data from Supabase instead of hardcoding `timelineSteps`.

## 1) Create Supabase client in main website

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## 2) Replace hardcoded timelineSteps with fetched data

```tsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type TimelineStep = {
  id: number;
  step: string;
  title: string;
  description: string;
  icon_svg: string | null;
  display_order: number;
};

const Timeline = () => {
  const scrollContainerRef = useRef(null);
  const [timelineSteps, setTimelineSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("timeline_entries")
        .select("id, step, title, description, icon_svg, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      if (!error && data) {
        const mapped = (data as TimelineStep[]).map((item) => ({
          ...item,
          icon: (
            <span
              className="inline-flex"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: item.icon_svg || "" }}
            />
          ),
        }));
        setTimelineSteps(mapped);
      }

      setLoading(false);
    };

    fetchTimeline();
  }, []);

  if (loading) {
    return <div className="py-16 text-center">Loading timeline...</div>;
  }

  return (
    <section>
      {/* Keep your existing timeline JSX, it already uses timelineSteps.map(...) */}
    </section>
  );
};

export default Timeline;
```

## 3) Environment variables in main website

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
