# Articulation MVP 

## Project info

This project is the beginning of a startup I'm making, it's the minimum viable product of an app/website. 
My app's focus is to improve and train communication skills through verbal and, not yet included in an app like this, nonverbal exercises. It is intended to be similar to duolingo in the sense that it encourages daily practice and gamifys your results and progress. 

The API it utilizes is the assemblyAI speech-to-text models API which allows speech to be transcripted and returned.

I've been in development of the frontend for a little bit but the majority of the prompts for this project's prompt log are for backend and API communication which I learned about on the fly while creating this.







# PROMPT LOG

I need to add speech-to-text transcription after the audio recording completes.

CONTEXT: This app records 2-minute audio clips where users speak about a topic. The recording functionality already exists and should save the audio as a blob or file.

IMPLEMENTATION NEEDED:
1. After recording stops (when timer hits 0:00), show a loading state with message "Analyzing your speech..."

2. Send the audio blob to AssemblyAI's API for transcription:
   - Use the AssemblyAI API key from environment variable: import.meta.env.VITE_ASSEMBLYAI_API_KEY
   - First POST the audio file to https://api.assemblyai.com/v2/upload (returns upload_url)
   - Then POST to https://api.assemblyai.com/v2/transcript with {"audio_url": upload_url}
   - Poll GET https://api.assemblyai.com/v2/transcript/{transcript_id} until status is "completed"
   - Extract the transcript text from the response

3. Once transcription completes, navigate to a new Results page/component, passing the transcript text

4. Error handling: If transcription fails or times out after 60 seconds, show an error message and let user retry

Use proper TypeScript types. Make the loading state visually calm (not aggressive spinner).

Where should I create the AssemblyAI integration? Create a new service file or add it to this component?








Create a comprehensive filler word detection and analysis system.

REQUIREMENTS:

1. Define filler word categories as TypeScript types/constants:
   - Hesitation fillers: ["um", "uh", "er", "ah", "hmm"]
   - Discourse markers: ["like", "you know", "I mean", "sort of", "kind of", "basically", "actually", "literally"]
   - Temporal fillers: ["so", "well", "now", "then", "okay", "alright"]
   - Thinking indicators: ["let me think", "let me see", "how do I say"]

2. Create a function analyzeFillerWords(transcript: string, durationMinutes: number) that returns:
   - totalFillerWords: number
   - fillersPerMinute: number
   - categoryCounts: object with count for each category
   - specificFillerCounts: object with individual filler word counts
   - fillerPositions: array of {word: string, position: number} for each filler found
   - distributionAnalysis: object with {beginning: number, middle: number, end: number}

3. Detection logic must:
   - Be case-insensitive
   - Use word boundaries (don't match "like" in "likely")
   - Handle punctuation properly
   - For multi-word fillers like "let me think", detect the full phrase

4. For distributionAnalysis, divide transcript into thirds and count fillers in each section

Export the function and all type definitions. Use clean, well-commented TypeScript.












Create a Results page component that displays transcription results with special visual effects.

PROPS NEEDED:
- transcript: string (the full transcription)
- analysisResults: object from our fillerWordDetection utility (will import)

VISUAL REQUIREMENTS:

1. TOP SECTION - Main metrics displayed large and prominent:
   - Total filler words (big number)
   - Fillers per minute rate (big number)

2. TRANSCRIPT DISPLAY with special effects:
   - Show transcript with TYPEWRITER EFFECT (reveal characters quickly, ~50ms per character)
   - CRITICAL: Every time a filler word appears during the reveal, flash the entire screen with a subtle red tint (overlay with rgba(255,0,0,0.15) for 200ms)
   - Highlight filler words in the transcript itself with red text or red background
   - Use the fillerPositions from analysis to know when to trigger flashes

3. DETAILED METRICS below transcript:
   - Show category breakdown (Hesitation: X, Discourse: X, Temporal: X, Thinking: X)
   - Show top 5 most-used specific fillers with their counts
   - Show distribution analysis with simple text: "Beginning: X, Middle: X, End: X"
   - Add insight text based on distribution pattern (most in beginning, middle, end, or evenly distributed)

4. BUTTONS at bottom:
   - "Try Another Topic" button
   - "View Progress" button (can be disabled/grayed for now)

STYLING: Use the warm, minimal aesthetic:
- Background: cream/off-white (#FAF9F6)
- Text: warm dark gray
- Accent color for buttons: terracotta/coral
- Serif font (Georgia) for headings
- Generous spacing

The typewriter effect and red flash are the most important UX elements - they create the "aha moment". Make them smooth and impactful.












I need to connect the recording flow to the results display.

CURRENT STATE: 
- Recording page captures audio and gets transcript from AssemblyAI
- ResultsPage component exists and can display analysis
- fillerWordDetection utility exists

NEEDED:
1. After transcription completes in the recording page, call analyzeFillerWords() with the transcript
2. Navigate to ResultsPage, passing both the transcript and analysis results as props or state
3. Make sure the recording duration (2 minutes) is passed to analyzeFillerWords

QUESTION: What's the best way to pass this data between pages? React Router params, Context, or state management? Choose what fits the existing code structure best.

Show me what changes to make and where.









Create a localStorage-based persistence system for exercise results.

REQUIREMENTS:

1. Store user demographics from the quiz permanently:
   - Key: 'user_demographics'
   - Value: {gender, ageRange, country}

2. Store exercise history as an array:
   - Key: 'exercise_history'
   - Each exercise object should contain:
     {
       timestamp: Date ISO string
       topic: string
       totalFillerWords: number
       fillersPerMinute: number
       categoryCounts: object
       transcript?: string (optional, only if space allows)
     }

3. Create functions:
   - saveDemographics(demographics)
   - getDemographics() → returns demographics or null
   - saveExerciseResult(result)
   - getExerciseHistory() → returns array of all exercises
   - getProgressStats() → returns {totalExercises, averageFPM, improvement trend}

4. Add localStorage size check - if getting close to 5MB limit, start removing oldest transcripts

Use proper error handling for localStorage access (private browsing mode, etc.). Export all functions with TypeScript types.












Update this ResultsPage component to save exercise results to localStorage when it mounts.

CHANGES NEEDED:
1. Import saveExerciseResult from our storage utility
2. In useEffect on mount, save the current exercise results to localStorage
3. The saved data should include everything from the analysis plus the topic and timestamp

Also update the "Try Another Topic" button to navigate back to the topic selection page, and update "View Progress" button to navigate to a new ProgressPage (create route for /progress even if page doesn't exist yet).











Create a Progress page that shows users their improvement over time.

DATA SOURCE: Use getExerciseHistory() and getProgressStats() from our storage utility

DISPLAY:
1. Summary stats at top:
   - Total exercises completed
   - Current average fillers per minute
   - Best (lowest) FPM achieved

2. Exercise history list showing most recent first:
   - Each entry shows: date, topic, FPM score
   - Make it clear if they improved from previous attempt

3. Simple trend indicator:
   - If FPM is decreasing over time: "You're improving! Keep practicing."
   - If FPM is increasing: "Keep at it. Consistency is key."
   - If stable: "You're maintaining steady performance."

4. Add note: "Your data is stored locally. Clearing browser data will erase your progress."

Keep the warm, minimal aesthetic. No need for fancy graphs in MVP - simple list is fine.












Update the app flow to check for existing demographics before showing the quiz.

LOGIC:
1. When app first loads (in App.tsx or wherever navigation starts), check getDemographics()
2. If demographics exist, skip directly to topic selection
3. If demographics don't exist, show quiz first
4. After quiz completion, save demographics with saveDemographics()

Also add a way for users to update their demographics later (maybe a settings icon in header that allows editing the quiz).

What's the cleanest way to implement this conditional routing given the current app structure?








Apply the warm, minimal visual aesthetic throughout the app.

DESIGN SYSTEM:
Colors:
- Background: #FAF9F6 (soft cream)
- Text: #2C2C2C (warm dark gray)
- Button accent: #C67B5C (terracotta)
- Filler highlight: #D64545 (muted red)

Typography:
- Headings: Georgia (serif)
- Body: System UI stack for better mobile readability
- Line height: 1.6-1.8

Components:
- Rounded corners: 8-12px
- Subtle shadows: very light, not dramatic
- Touch targets on mobile: minimum 44x44px
- Generous padding and margins

Update the Tailwind config to include these custom colors, and create utility classes if needed. Apply these styles consistently across all pages.

Make sure it looks good on mobile first, then desktop.











Add mobile-specific optimizations and meta tags.

NEEDED:
1. In index.html, add proper mobile viewport meta tags and iOS-specific settings:
   - viewport meta with user-scalable=no for better touch
   - apple-mobile-web-app-capable for iOS home screen
   - theme-color matching our cream background

2. Add bottom padding to main content areas to account for mobile browser UI

3. Ensure all interactive elements (buttons, dropdowns) have proper touch targets (44x44px minimum)

4. Test that the recording functionality has proper mobile microphone permissions handling with clear error messages

5. Make sure the typewriter effect and red flash work smoothly on mobile devices (no performance issues)

Show me what changes to make in which files.


