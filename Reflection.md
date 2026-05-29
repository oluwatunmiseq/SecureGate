# SecureGate — Reflection & Engineering Analysis
 **Name:** Quadri Oluwatunmise
  **Cohort:** Design to MVP Bootcamp
   **Live URL:** https://secure-gate-eta.vercel.app/
    **GitHub Repo:** [Your repo URL]

     -- ## **Part 1 — What I Built**
      I built SecureGate a webapp that prioritizes authentication and security with peatures that protects the user's database and successfully provides a seemless signup, login, verification features

      ## **Part 2 — What Surprised Me**
      Deploying to Vercel almost made me cry, I would need a thorough lession on how to sucessfully deploy, I succeeded, and the quote - if it works don't touch it keeps ringing in my head, but I feel something is still wrong, what I learnt is to learn more on vercel deployment and understand it better

       ## Part 3 — Engineering Laws Quiz

        ### Q1 — Murphy's Law 
        **Code reference:** // 3. Check expiry
     if (existingToken.expires < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return {
        success: false,
        error: 'This link is invalid or has expired. Please request a new one.',
      }; 
        **My Answer:** Murphy's law influenced expiration on password token 
        **What goes wrong if ignored:** Without an expiry date on a token generated,it leaves the app vulnurable to crashout and and also vulnulrable to hackers

        ### Q2 — Law of Leaky Abstractions
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]

        ### Q3 — YAGNI
        **Code reference:** - **Scope: 
     export const metadata: Metadata = {
     title: 'SecureGate — Secure & Effortless Authentication',
     description: 'Provide a reusable, secure authentication foundation with uncompromising security.',
     }; [cite_start]SecureGate is **not** a social platform, a productivity tool, an enterprise IT directory, or a commercial product 
        **My Answer:** The requirement of securegate is two things, Authentication and Security, A nice dashboard would have been a lovely feature to login to, but following YAGNI encourages focusing on the important task
        **What goes wrong if ignored:** Adding extra features that aren't needed in the current MVP leads to bloat, maintainance issues and extended complexity

        ### Q4 —  Kerckhoffs's Principle
        **Code reference:**  // 2. Hash password immediately — never store or log plain text
     const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); 
        **My Answer:** A salt that is added using the bcrypt is very essential, because the salt combines with the password to create a unique hash making it safer and more secure for users 
        **What goes wrong if ignored:** If incorrectly implemented or completly ignored, this can leave users vunulrable to harckers with rainbow tables

        ### Q5 —   Postel's Law + Security by Design
        **Code reference:** 
     // 3. Business logic
     try {
     const user = await db.user.findUnique({ where: { email } });

     // Always return the same response — do not reveal if account exists
     if (!user) {
      return { success: true };
     }
        **My Answer:**  forgot-password endpoint returns a success message even if the email does not exist to protect from hackers discovering if an email exist or not, It helps to totally reduce the chance of hackers fishing out emails that exist on a platform. Because of the success message, they aren't able to guys which email actually exists or not. 
        **What goes wrong if ignored:** Without security design, hackers are able to discover the emails that exist on the platform leading to damage of user privacy and information.

        ### Q6 —  The Boy Scout Rule
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]

        ### Q7 —   Gall's Law
        **Code reference:** agent MD > RULES > SKILLS
        **My Answer:** SecureGate was built in 6 phases, with the instruction - Each phase has a clear goal. Do not skip ahead. A broken phase 2 built on a shaky phase 1 is worse than a solid phase 1 alone, This follows Gall's Law of growing a system gradually 
        **What goes wrong if ignored:** A broken phase 2 built on a shaky phase 1 is worse than a solid phase 1 alone.

        ### Q8 —  The Law of Leaky Abstractions
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]

        ### Q9 —  Zawinski's Law
        **Code reference:** Rate limiting must happen **before** any database query on these routes.
        ```tsimport { Ratelimit } from "@upstash/ratelimit";
        import { Redis } from "@upstash/redis"; 
        **My Answer:** To me, Zawinski's Law follows YAGNI, reduce bugs and bloats and stay disciplined by staying focused on the main goal. 
        **What goes wrong if ignored:** The application becomes harder to use and maintain.

        ### Q10 —   The Principle of Least Surprise
        **Code reference:** | Wrong email or password | "We couldn't sign you in. Please check your details and try again." |
        Never:- Return raw Prisma error messages
        **My Answer:** The error message when credentials are wrong are - We couldn't sign you in. Please check your details and try again. Using the knowlegde of Good UX, users should be given in plain language, exactly what went wrong, i.e giving clear feedback
        **What goes wrong if ignored:** Software should be predictable, when it's not it causes confusion and leads to an app that isn't functional or usable

        ### Q11 —   Murphy's Law + Defensive Programming
        **Code reference:**  // Redirect unauthenticated users away from protected routes
     if (isProtectedRoute && !isAuthenticated) {
     return NextResponse.redirect(new URL('/sign-in', nextUrl));} 
        **My Answer:** Murphy says - anything that will go wrong will go wrong, defensive programming says, assume users will break things and prepare for it before it happens. When an unauthenticated user tries to access the dashboard, the response is to redirect back to sign in page. 
        **What goes wrong if ignored:** Not protecting against unauthenticated users defeats the whole purpose of SecureGate

        ### Q12 —   Kerckhoffs's Principle + Technical Debt
        **Code reference:** ## Sessions

     - Sessions are managed by NextAuth — do not implement custom session logic.
      - Use NextAuth's built-in JWT or database session strategy — do not mix them.
     - Sessions must be fully invalidated on sign-out — call `signOut()` with `{ redirect: false }` and handle server-side.
      - Never store sensitive user data (password hash, token values) in the session payload.
     - Session payload may include: `id`, `email`, `name`, `emailVerified`. 
        **My Answer:**  if my NEXTAUTH_SECRET was accidentally committed to GitHub, this would reveal my keys to attackers, which they could use to hack or hijack sessions, leading to a compromised application that's unsafe for authorized users. I would recover by generating new keys, and ensuring all keys are properly placed into Vercel and instructing Git to ignore all sensitive files, also ensuring old sessions are expired.  
        **What goes wrong if ignored:** If the recovery steps are ignored, attackers could have access to user's private information, leading to a lawsuit -_-

        ### Q13 —   Conway's Law
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]

        ### Q14 —   Technical Debt
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]
        
        ### Q15 —  Synthesis question — All principles apply
        **Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48 
        **My Answer:** [Your answer here] 
        **What goes wrong if ignored:** [Your answer here]

        ## Part 4 — One Thing I Would Refactor 
        [Describe your identified technical debt and paste the refactored version]

        ## Part 5 — How This Changes How I Build 
        [What you now know about authentication, security, and engineering principles that you did not know before]