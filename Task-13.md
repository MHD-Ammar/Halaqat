Act as a Senior Frontend Developer & UX Specialist. We are building the Recitation Recording UI. Current State:

Teacher Dashboard lists students.

We have useTodaySession hook.

We need a UI to record what a specific student recited.

Your Goal: Create a "Student Action Sheet" component that opens when clicking a student, allowing rapid data entry for recitation.

Please follow these instructions strictly.

1. Component Structure: The Bottom Sheet
   Library: Use Shadcn Sheet component.

UX Pattern:

On Mobile: It should dock at the bottom.

On Desktop: It can be a Side Sheet (Right) or a Dialog.

Trigger: Wrap the student row in the Dashboard with the Trigger. Clicking the student opens this Sheet.

2. The Form (Recitation Details)
   Inside the Sheet, build a form using react-hook-form and zod.

Field 1: Lesson Type (Tabs):

Use Shadcn Tabs or ToggleGroup.

Options: "New Lesson" (Hifz) | "Review" (Mraja'a).

Default: "New Lesson".

Field 2: Surah Selection (Combobox):

Crucial: Do NOT use a standard <select>. Use Shadcn Command + Popover (Combobox) to allow searching by name (e.g., typing "Baq" shows "Al-Baqara").

Load the Surah list from the API (/curriculum/surahs) using a new custom hook useSurahs().

Field 3: Verses (Row of Inputs):

Two inputs side-by-side: Start Verse and End Verse.

Validation: End Verse must be >= Start Verse.

Field 4: Quality (The Grading):

Visuals: Do NOT use a dropdown. Use 5 Large Buttons arranged in a grid or row.

Colors:

Excellent -> Emerald/Green.

V. Good -> Blue.

Good -> Yellow.

Acceptable -> Orange.

Poor -> Red.

3. Integration & Feedback
   Mutation: Create useRecordRecitation hook using useMutation.

Optimistic Update: Not strictly necessary here, but on onSuccess:

Close the Sheet.

Show a Toast notification saying: "Saved! +5 Points" (Calculate or fetch points from response).

Invalidate the today-session query to update the student's total points on the dashboard.

4. Refinement (The "Smart" Features)
   Auto-Increment Suggestion: If the student recited "Al-Baqara 1-10" yesterday, can we default the inputs to "Al-Baqara 11-..."? (Add a comment in code for this future feature, but for now, just keep inputs empty or default to Surah #1).

Acceptance Criteria (Checklist)
[ ] Clicking a student opens the Sheet without lagging.

[ ] I can search for a Surah by typing part of its name.

[ ] Clicking "Excellent" is one tap (maybe auto-submit, or tap + save). Let's keep it "Select then Save" for safety.

[ ] The form validates that verses are numbers and logical.

[ ] After saving, the Dashboard updates to show the new point total.

Output: Provide:

The useSurahs hook (fetching the list).

The StudentActionSheet component (full UI).

The Zod schema for validation.
