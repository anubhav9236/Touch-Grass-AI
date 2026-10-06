/**
 * TrailBuddy AI — Frontend Application Logic
 * Hacktoberfest Open-Source AI Challenge: Touch Grass Edition
 *
 * Implements local AI health polling, asynchronous structured plan generation,
 * interactive checklist persistence, phone-down challenge timer, and random outdoor missions.
 */

document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // DOM Element References
    // =========================================================================
    
    // Header & Status
    const aiStatusPill = document.getElementById("ai-status-pill");
    const statusText = document.getElementById("status-text");
    const btnOpenChallenge = document.getElementById("btn-open-challenge");
    const btnQuickGrass = document.getElementById("btn-quick-grass");
    const btnOpenSetup = document.getElementById("btn-open-setup");
    const btnBannerDemo = document.getElementById("btn-banner-demo");
    const btnBannerGuide = document.getElementById("btn-banner-guide");

    // Form Inputs & Controls
    const trailForm = document.getElementById("trail-form");
    const inputTime = document.getElementById("input-time");
    const inputActivity = document.getElementById("input-activity");
    const inputFitness = document.getElementById("input-fitness");
    const inputCompanions = document.getElementById("input-companions");
    const inputLocation = document.getElementById("input-location");
    const inputWeather = document.getElementById("input-weather");
    const inputNotes = document.getElementById("input-notes");
    const btnGeneratePlan = document.getElementById("btn-generate-plan");
    const btnTryDemo = document.getElementById("btn-try-demo");

    // Result States & Containers
    const stateEmpty = document.getElementById("state-empty");
    const stateLoading = document.getElementById("state-loading");
    const stateError = document.getElementById("state-error");
    const stateResult = document.getElementById("state-result");
    const loadingQuote = document.getElementById("loading-quote");
    const loadingModelName = document.getElementById("loading-model-name");

    // Error State Elements
    const errorTitle = document.getElementById("error-title");
    const errorDesc = document.getElementById("error-desc");
    const btnRetryHealth = document.getElementById("btn-retry-health");
    const btnErrorDemo = document.getElementById("btn-error-demo");

    // Result Display Elements
    const missionTitle = document.getElementById("mission-title");
    const demoIndicatorTag = document.getElementById("demo-indicator-tag");
    const resultModelTag = document.getElementById("result-model-tag");
    const missionWhyText = document.getElementById("mission-why-text");
    const planTimelineContainer = document.getElementById("plan-timeline-container");
    const missionChecklistContainer = document.getElementById("mission-checklist-container");
    const missionSafetyContainer = document.getElementById("mission-safety-container");
    const missionPhoneDownText = document.getElementById("mission-phonedown-text");
    const missionVariationText = document.getElementById("mission-variation-text");
    const sectionWhyWrapper = document.getElementById("section-why-wrapper");
    const sectionVariationWrapper = document.getElementById("section-variation-wrapper");

    // Result Action Buttons
    const btnCopyPlan = document.getElementById("btn-copy-plan");
    const btnPrintPlan = document.getElementById("btn-print-plan");
    const btnGenerateAnother = document.getElementById("btn-generate-another");
    const btnStartMissionGrass = document.getElementById("btn-start-mission-grass");
    const btnStartPhoneDownMode = document.getElementById("btn-start-phonedown-mode");

    // Modals
    const modalGrassMode = document.getElementById("modal-grass-mode");
    const btnCloseGrassModal = document.getElementById("btn-close-grass-modal");
    const btnDismissAndExit = document.getElementById("btn-dismiss-and-exit");

    const modalChallenge = document.getElementById("modal-challenge");
    const btnCloseChallengeModal = document.getElementById("btn-close-challenge-modal");
    const btnAcceptChallenge = document.getElementById("btn-accept-challenge");
    const btnRerollChallenge = document.getElementById("btn-reroll-challenge");

    const modalSetup = document.getElementById("modal-setup");
    const btnCloseSetupModal = document.getElementById("btn-close-setup-modal");
    const btnCloseSetupAction = document.getElementById("btn-close-setup-action");
    const btnModalTestHealth = document.getElementById("btn-modal-test-health");
    const modalHealthDot = document.getElementById("modal-health-dot");
    const modalHealthStatusText = document.getElementById("modal-health-status-text");

    // Timer Controls
    const timerDisplay = document.getElementById("timer-display");
    const timerStateLabel = document.getElementById("timer-state-label");
    const grassStatusMsg = document.getElementById("grass-status-msg");
    const btnTimerStart = document.getElementById("btn-timer-start");
    const btnTimerPause = document.getElementById("btn-timer-pause");
    const btnTimerReset = document.getElementById("btn-timer-reset");
    const timerPresetBtns = document.querySelectorAll(".timer-preset-btn");

    // Toast Container
    const toastContainer = document.getElementById("toast-container");

    // App State
    let currentPlanData = null;
    let quoteInterval = null;
    let isOllamaOnline = false;
    let configuredModel = "llama3.2";

    // Nature Quotes for Loading State
    const NATURE_QUOTES = [
        '"The clearest way into the Universe is through a forest wilderness." — John Muir',
        '"In every walk with nature, one receives far more than he seeks." — John Muir',
        '"Look deep into nature, and then you will understand everything better." — Albert Einstein',
        '"Adopt the pace of nature: her secret is patience." — Ralph Waldo Emerson',
        '"Nature does not hurry, yet everything is accomplished." — Lao Tzu',
        '"To sit in the shade on a fine day, and look upon verdure, is the most perfect refreshment." — Jane Austen',
        '"Leave the roads, take the trails." — Pythagoras'
    ];

    // =========================================================================
    // Toast Notification System
    // =========================================================================
    function showToast(message, icon = "🌿", duration = 3200) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function escapeHTML(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // =========================================================================
    // Health Check & AI Status (Gemini + Ollama)
    // =========================================================================
    async function checkLocalAIHealth() {
        aiStatusPill.className = "status-pill status-loading";
        statusText.textContent = "Checking AI Engine...";

        try {
            const resp = await fetch("/health");
            const data = await resp.json();

            configuredModel = data.model || "gemini-3.7-flash";
            loadingModelName.textContent = configuredModel;

            if (data.gemini) {
                isOllamaOnline = true;
                aiStatusPill.className = "status-pill status-online";
                statusText.textContent = `🟢 Gemini AI (${configuredModel})`;
                aiStatusPill.title = `Gemini AI Engine active. Model: ${configuredModel}. High-speed cloud generation ready.`;
                
                if (modalHealthDot && modalHealthStatusText) {
                    modalHealthDot.style.background = "#52b788";
                    modalHealthStatusText.textContent = `Connected! Google Gemini AI is active with ${configuredModel}.`;
                }
            } else if (data.ollama) {
                isOllamaOnline = true;
                aiStatusPill.className = "status-pill status-online";
                statusText.textContent = `🟢 Local AI (${configuredModel})`;
                aiStatusPill.title = `Local AI active via Ollama. Model: ${configuredModel}. 100% offline ready.`;
                
                if (modalHealthDot && modalHealthStatusText) {
                    modalHealthDot.style.background = "#52b788";
                    modalHealthStatusText.textContent = `Connected! Ollama is running with ${configuredModel}.`;
                }
            } else {
                isOllamaOnline = false;
                aiStatusPill.className = "status-pill status-offline";
                statusText.textContent = "🔴 AI Offline";
                aiStatusPill.title = "AI is unavailable. Click to view setup instructions.";

                if (modalHealthDot && modalHealthStatusText) {
                    modalHealthDot.style.background = "#e63946";
                    modalHealthStatusText.textContent = "AI engine not connected. Configure Gemini API key or start Ollama.";
                }
            }
        } catch (err) {
            isOllamaOnline = false;
            aiStatusPill.className = "status-pill status-offline";
            statusText.textContent = "🔴 AI Offline";

            if (modalHealthDot && modalHealthStatusText) {
                modalHealthDot.style.background = "#e63946";
                modalHealthStatusText.textContent = "Could not connect to Flask /health endpoint.";
            }
        }
    }

    // Check health immediately upon startup
    checkLocalAIHealth();

    // =========================================================================
    // Form Interactivity & Selection Handlers
    // =========================================================================

    // Time Selection Buttons
    const timeButtons = document.querySelectorAll("[data-time]");
    timeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            timeButtons.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-checked", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
            inputTime.value = btn.getAttribute("data-time");
        });
    });

    // Activity Selection Cards
    const activityCards = document.querySelectorAll(".activity-card");
    activityCards.forEach(card => {
        card.addEventListener("click", () => {
            activityCards.forEach(c => {
                c.classList.remove("active");
                c.setAttribute("aria-checked", "false");
            });
            card.classList.add("active");
            card.setAttribute("aria-checked", "true");
            inputActivity.value = card.getAttribute("data-activity");
        });
    });

    // Fitness Selection Chips
    const fitnessButtons = document.querySelectorAll("[data-fitness]");
    fitnessButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            fitnessButtons.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-checked", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
            inputFitness.value = btn.getAttribute("data-fitness");
        });
    });

    // Companionship Selection Chips
    const companionButtons = document.querySelectorAll("[data-companions]");
    companionButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            companionButtons.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-checked", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
            inputCompanions.value = btn.getAttribute("data-companions");
        });
    });

    // Interests Multi-Select Chips
    const interestTags = document.querySelectorAll(".interest-tag");
    interestTags.forEach(tag => {
        tag.addEventListener("click", () => {
            tag.classList.toggle("active");
        });
    });

    function getSelectedInterests() {
        const active = document.querySelectorAll(".interest-tag.active");
        return Array.from(active).map(t => t.getAttribute("data-interest"));
    }

    // Quick Presets
    const presetButtons = document.querySelectorAll(".preset-chip");
    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const preset = btn.getAttribute("data-preset");
            applyPreset(preset);
        });
    });

    function applyPreset(preset) {
        if (preset === "nature-walk") {
            selectTime("30 minutes");
            selectActivity("Walking");
            selectFitness("Beginner");
            selectCompanions("Solo");
            setInterests(["Nature", "Trees"]);
            showToast("Preset loaded: 30m Nature Walk", "🚶");
        } else if (preset === "quick-recharge") {
            selectTime("15 minutes");
            selectActivity("Outdoor relaxation");
            selectFitness("Beginner");
            selectCompanions("Solo");
            setInterests(["Relaxation"]);
            showToast("Preset loaded: 15m Quick Recharge", "🧘");
        } else if (preset === "forest-explorer") {
            selectTime("60 minutes");
            selectActivity("Hiking");
            selectFitness("Moderate");
            selectCompanions("With friends");
            setInterests(["Nature", "Exploring"]);
            showToast("Preset loaded: 60m Exploration", "🥾");
        }
    }

    function selectTime(val) {
        timeButtons.forEach(b => {
            const match = b.getAttribute("data-time") === val;
            b.classList.toggle("active", match);
            b.setAttribute("aria-checked", match.toString());
        });
        inputTime.value = val;
    }

    function selectActivity(val) {
        activityCards.forEach(c => {
            const match = c.getAttribute("data-activity").toLowerCase() === val.toLowerCase();
            c.classList.toggle("active", match);
            c.setAttribute("aria-checked", match.toString());
        });
        inputActivity.value = val;
    }

    function selectFitness(val) {
        fitnessButtons.forEach(b => {
            const match = b.getAttribute("data-fitness") === val;
            b.classList.toggle("active", match);
            b.setAttribute("aria-checked", match.toString());
        });
        inputFitness.value = val;
    }

    function selectCompanions(val) {
        companionButtons.forEach(b => {
            const match = b.getAttribute("data-companions") === val;
            b.classList.toggle("active", match);
            b.setAttribute("aria-checked", match.toString());
        });
        inputCompanions.value = val;
    }

    function setInterests(list) {
        interestTags.forEach(t => {
            const val = t.getAttribute("data-interest");
            t.classList.toggle("active", list.includes(val));
        });
    }

    // =========================================================================
    // View State Switcher
    // =========================================================================
    function setViewState(stateName) {
        stateEmpty.classList.add("hidden");
        stateLoading.classList.add("hidden");
        stateError.classList.add("hidden");
        stateResult.classList.add("hidden");

        if (quoteInterval) {
            clearInterval(quoteInterval);
            quoteInterval = null;
        }

        if (stateName === "empty") {
            stateEmpty.classList.remove("hidden");
        } else if (stateName === "loading") {
            stateLoading.classList.remove("hidden");
            // Rotate quotes
            let qIdx = 0;
            loadingQuote.textContent = NATURE_QUOTES[0];
            quoteInterval = setInterval(() => {
                qIdx = (qIdx + 1) % NATURE_QUOTES.length;
                loadingQuote.textContent = NATURE_QUOTES[qIdx];
            }, 3000);
        } else if (stateName === "error") {
            stateError.classList.remove("hidden");
        } else if (stateName === "result") {
            stateResult.classList.remove("hidden");
        }
    }

    // =========================================================================
    // Plan Rendering Logic
    // =========================================================================
    function renderMissionPlan(data) {
        currentPlanData = data;

        // Title & Model Tags
        missionTitle.textContent = data.title || "Outdoor Adventure Plan";
        resultModelTag.textContent = data.model_used || configuredModel;

        if (data.is_demo) {
            demoIndicatorTag.classList.remove("hidden");
            demoIndicatorTag.textContent = "SAMPLE DEMO PLAN";
        } else {
            demoIndicatorTag.classList.add("hidden");
        }

        // Why
        if (data.why) {
            missionWhyText.textContent = data.why;
            sectionWhyWrapper.classList.remove("hidden");
        } else {
            sectionWhyWrapper.classList.add("hidden");
        }

        // Timed Steps Timeline
        planTimelineContainer.innerHTML = "";
        const steps = data.plan || [];
        if (steps.length > 0) {
            steps.forEach((step, index) => {
                const stepEl = document.createElement("div");
                stepEl.className = "timeline-step";
                
                const timeStr = typeof step === "object" ? (step.time || `Step ${index + 1}`) : `Step ${index + 1}`;
                const textStr = typeof step === "object" ? (step.text || "") : step;

                stepEl.innerHTML = `
                    <span class="step-time-pill">${escapeHTML(timeStr)}</span>
                    <span class="step-content">${escapeHTML(textStr)}</span>
                `;
                planTimelineContainer.appendChild(stepEl);
            });
        } else {
            planTimelineContainer.innerHTML = `<p class="step-content">Step outside and enjoy your tailored outdoor route.</p>`;
        }

        // Checklist (Interactive with localStorage)
        missionChecklistContainer.innerHTML = "";
        const checklistItems = data.checklist || [
            "Comfortable footwear",
            "Water bottle",
            "Weather-appropriate clothing"
        ];
        
        const storageKey = `trailbuddy_chk_${data.title ? data.title.replace(/\s+/g, '_') : 'current'}`;
        let savedChecked = [];
        try {
            savedChecked = JSON.parse(localStorage.getItem(storageKey) || "[]");
        } catch (e) {}

        checklistItems.forEach((itemText, index) => {
            const isChecked = savedChecked.includes(index);
            const li = document.createElement("li");
            li.className = `checklist-item ${isChecked ? 'checked' : ''}`;
            
            const chkId = `chk-item-${index}`;
            li.innerHTML = `
                <input type="checkbox" id="${chkId}" class="checklist-checkbox" ${isChecked ? 'checked' : ''}>
                <label for="${chkId}" class="checklist-label">${escapeHTML(itemText)}</label>
            `;

            const checkbox = li.querySelector("input");
            checkbox.addEventListener("change", (e) => {
                li.classList.toggle("checked", e.target.checked);
                
                let currentSaved = [];
                try {
                    currentSaved = JSON.parse(localStorage.getItem(storageKey) || "[]");
                } catch (err) {}

                if (e.target.checked) {
                    if (!currentSaved.includes(index)) currentSaved.push(index);
                } else {
                    currentSaved = currentSaved.filter(i => i !== index);
                }
                localStorage.setItem(storageKey, JSON.stringify(currentSaved));
            });

            missionChecklistContainer.appendChild(li);
        });

        // Safety Tips
        missionSafetyContainer.innerHTML = "";
        const safetyTips = data.safety || [
            "Stay observant of uneven footing and traffic.",
            "Adjust intensity according to your energy and hydration levels."
        ];
        safetyTips.forEach(tip => {
            const li = document.createElement("li");
            li.className = "safety-item";
            li.innerHTML = `<span class="safety-bullet">•</span> <span>${escapeHTML(tip)}</span>`;
            missionSafetyContainer.appendChild(li);
        });

        // Phone-Down Challenge
        missionPhoneDownText.textContent = data.phone_down_challenge || (
            "Put your phone on silent and keep it in your bag for the entire outing. Only use it if needed for emergency safety."
        );

        // Variation
        if (data.optional_variation) {
            missionVariationText.textContent = data.optional_variation;
            sectionVariationWrapper.classList.remove("hidden");
        } else {
            sectionVariationWrapper.classList.add("hidden");
        }

        // Show result state
        setViewState("result");

        // Smooth scroll to results on mobile/small screens
        if (window.innerWidth < 1024) {
            document.getElementById("result-container").scrollIntoView({ behavior: "smooth" });
        }
    }

    // =========================================================================
    // Plan Generation (POST /generate)
    // =========================================================================
    async function handleGeneratePlan(e) {
        if (e) e.preventDefault();

        const payload = {
            time: inputTime.value || "30 minutes",
            activity: inputActivity.value || "Walking",
            fitness: inputFitness.value || "Beginner",
            location: inputLocation.value.trim() || "Local neighborhood",
            interests: getSelectedInterests(),
            weather: inputWeather.value.trim() || "Pleasant outdoor weather",
            companions: inputCompanions.value || "Solo",
            notes: inputNotes.value.trim() || ""
        };

        setViewState("loading");
        btnGeneratePlan.disabled = true;

        try {
            const resp = await fetch("/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            if (resp.ok && data.success) {
                renderMissionPlan(data);
                showToast("Your outdoor mission is ready!", "🌿");
            } else {
                // Show friendly error with setup instructions
                errorTitle.textContent = "🌱 TrailBuddy can't reach your local AI yet.";
                errorDesc.textContent = data.error || "Please ensure Ollama is running and model llama3.2 is installed.";
                setViewState("error");
            }
        } catch (err) {
            errorTitle.textContent = "🌱 TrailBuddy can't reach your local AI yet.";
            errorDesc.textContent = "Connection to local Ollama failed. Start Ollama and pull your model.";
            setViewState("error");
        } finally {
            btnGeneratePlan.disabled = false;
        }
    }

    trailForm.addEventListener("submit", handleGeneratePlan);

    // =========================================================================
    // Instant Demo Plan Loader
    // =========================================================================
    async function loadDemoPlan() {
        setViewState("loading");
        
        // Populate inputs to match sample demo
        selectTime("30 minutes");
        selectActivity("Walking");
        selectFitness("Beginner");
        selectCompanions("Solo");
        setInterests(["Nature"]);
        inputLocation.value = "Local neighborhood";

        try {
            const resp = await fetch("/api/demo-plan");
            const data = await resp.json();
            
            setTimeout(() => {
                renderMissionPlan(data);
                showToast("Sample Demo Plan loaded! (Offline preview)", "⚡");
            }, 600);
        } catch (e) {
            setViewState("empty");
            showToast("Failed to load demo plan.", "⚠️");
        }
    }

    btnTryDemo.addEventListener("click", loadDemoPlan);
    btnBannerDemo.addEventListener("click", loadDemoPlan);
    btnErrorDemo.addEventListener("click", loadDemoPlan);

    // Retry connection from error view
    btnRetryHealth.addEventListener("click", async () => {
        showToast("Rechecking local AI...", "🔄");
        await checkLocalAIHealth();
        if (isOllamaOnline) {
            showToast("Local AI is now online! Generating plan...", "🟢");
            handleGeneratePlan();
        } else {
            showToast("Ollama is still not responding. Check terminal.", "⚠️");
        }
    });

    // =========================================================================
    // Action Bar Handlers (Copy, Print, Generate Another)
    // =========================================================================
    btnCopyPlan.addEventListener("click", () => {
        if (!currentPlanData) return;

        let markdown = `# 🌿 ${currentPlanData.title}\n\n`;
        if (currentPlanData.why) markdown += `> **Why This:** ${currentPlanData.why}\n\n`;
        
        markdown += `### 🗺️ Step-by-Step Plan\n`;
        (currentPlanData.plan || []).forEach(step => {
            const t = typeof step === "object" ? step.time : "Step";
            const txt = typeof step === "object" ? step.text : step;
            markdown += `- **${t}**: ${txt}\n`;
        });

        markdown += `\n### 🎒 Bring This Checklist\n`;
        (currentPlanData.checklist || []).forEach(item => {
            markdown += `- [ ] ${item}\n`;
        });

        markdown += `\n### 🛡️ Safety Tips\n`;
        (currentPlanData.safety || []).forEach(tip => {
            markdown += `- ${tip}\n`;
        });

        if (currentPlanData.phone_down_challenge) {
            markdown += `\n### 📵 Phone-Down Challenge\n${currentPlanData.phone_down_challenge}\n`;
        }

        markdown += `\n---\n*Planned with TrailBuddy AI (Local open-weight AI via Ollama)*\n`;

        navigator.clipboard.writeText(markdown)
            .then(() => showToast("Plan copied to clipboard! 📋", "✅"))
            .catch(() => showToast("Could not copy to clipboard", "⚠️"));
    });

    btnPrintPlan.addEventListener("click", () => {
        window.print();
    });

    btnGenerateAnother.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.innerWidth >= 1024) {
            inputLocation.focus();
        }
    });

    // =========================================================================
    // 📵 Touch Grass Mode Countdown Timer
    // =========================================================================
    let timerTotalSeconds = 30 * 60;
    let timerRemainingSeconds = 30 * 60;
    let timerInterval = null;
    let isTimerRunning = false;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timerRemainingSeconds);
    }

    function startTimer() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        btnTimerStart.classList.add("hidden");
        btnTimerPause.classList.remove("hidden");
        timerStateLabel.textContent = "Outdoor session active";
        grassStatusMsg.textContent = "Screen time ends here. Adventure starts now. 🌿";

        timerInterval = setInterval(() => {
            if (timerRemainingSeconds > 0) {
                timerRemainingSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                btnTimerStart.classList.remove("hidden");
                btnTimerPause.classList.add("hidden");
                timerStateLabel.textContent = "Mission complete! 🎉";
                grassStatusMsg.textContent = "Awesome job touching grass today! 🌿";
                showToast("Phone-down challenge completed! Well done! 🌿", "🎉", 6000);
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isTimerRunning) return;
        clearInterval(timerInterval);
        isTimerRunning = false;
        btnTimerStart.classList.remove("hidden");
        btnTimerPause.classList.add("hidden");
        timerStateLabel.textContent = "Paused";
        grassStatusMsg.textContent = "Challenge paused. Step back outside when ready!";
    }

    function resetTimer() {
        pauseTimer();
        timerRemainingSeconds = timerTotalSeconds;
        updateTimerDisplay();
        timerStateLabel.textContent = "Ready to unplug";
        grassStatusMsg.textContent = "Screen time ends here. Adventure starts now. 🌿";
    }

    function setTimerPresetMinutes(mins) {
        timerTotalSeconds = mins * 60;
        resetTimer();
        timerPresetBtns.forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.getAttribute("data-minutes")) === mins);
        });
    }

    timerPresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const mins = parseInt(btn.getAttribute("data-minutes"), 10);
            setTimerPresetMinutes(mins);
        });
    });

    btnTimerStart.addEventListener("click", startTimer);
    btnTimerPause.addEventListener("click", pauseTimer);
    btnTimerReset.addEventListener("click", resetTimer);

    function openGrassModal(initialMinutes = 30) {
        setTimerPresetMinutes(initialMinutes);
        modalGrassMode.classList.remove("hidden");
    }

    function closeGrassModal() {
        modalGrassMode.classList.add("hidden");
    }

    btnQuickGrass.addEventListener("click", () => openGrassModal(30));
    btnStartMissionGrass.addEventListener("click", () => openGrassModal(30));
    btnStartPhoneDownMode.addEventListener("click", () => openGrassModal(30));
    btnCloseGrassModal.addEventListener("click", closeGrassModal);
    btnDismissAndExit.addEventListener("click", () => {
        closeGrassModal();
        showToast("Enjoy your outdoor time! 🌿", "👋");
    });

    // =========================================================================
    // 🎲 Random Outdoor Micro-Challenge Modal
    // =========================================================================
    const chTitle = document.getElementById("ch-title");
    const chDesc = document.getElementById("ch-desc");
    const chTag = document.getElementById("ch-tag");
    const chDuration = document.getElementById("ch-duration");
    const chDiff = document.getElementById("ch-diff");
    const chPhoneRule = document.getElementById("ch-phone-rule");

    let currentChallenge = null;

    async function loadRandomChallenge() {
        try {
            const resp = await fetch("/api/random-challenge");
            const data = await resp.json();
            if (data.success && data.challenge) {
                currentChallenge = data.challenge;
                chTitle.textContent = currentChallenge.title;
                chDesc.textContent = currentChallenge.description;
                chTag.textContent = currentChallenge.tag || "🌿 Challenge";
                chDuration.textContent = `⏱️ ${currentChallenge.duration || '15 min'}`;
                chDiff.textContent = currentChallenge.difficulty || "Easy";
                chPhoneRule.textContent = currentChallenge.phone_rule || "Keep phone silent.";
            }
        } catch (e) {
            chTitle.textContent = "Find 3 Distinct Leaf Shapes";
            chDesc.textContent = "Explore your immediate neighborhood and find 3 different leaf textures and shapes.";
            chDuration.textContent = "⏱️ 15 min";
        }
    }

    function openChallengeModal() {
        loadRandomChallenge();
        modalChallenge.classList.remove("hidden");
    }

    function closeChallengeModal() {
        modalChallenge.classList.add("hidden");
    }

    btnOpenChallenge.addEventListener("click", openChallengeModal);
    btnCloseChallengeModal.addEventListener("click", closeChallengeModal);
    btnRerollChallenge.addEventListener("click", loadRandomChallenge);
    btnAcceptChallenge.addEventListener("click", () => {
        closeChallengeModal();
        let dur = 15;
        if (currentChallenge && currentChallenge.duration && currentChallenge.duration.includes("30")) {
            dur = 30;
        }
        openGrassModal(dur);
        startTimer();
    });

    // =========================================================================
    // ⚙️ Local AI Setup Modal & Connection Tester
    // =========================================================================
    function openSetupModal() {
        modalSetup.classList.remove("hidden");
        checkLocalAIHealth();
    }

    function closeSetupModal() {
        modalSetup.classList.add("hidden");
    }

    aiStatusPill.addEventListener("click", openSetupModal);
    btnOpenSetup.addEventListener("click", openSetupModal);
    btnBannerGuide.addEventListener("click", openSetupModal);
    btnCloseSetupModal.addEventListener("click", closeSetupModal);
    btnCloseSetupAction.addEventListener("click", closeSetupModal);

    btnModalTestHealth.addEventListener("click", async () => {
        modalHealthStatusText.textContent = "Testing connection...";
        await checkLocalAIHealth();
    });

    // One-click code copy helper in Setup modal
    const copyCodeBtns = document.querySelectorAll(".btn-copy-code");
    copyCodeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const cmd = btn.getAttribute("data-copy");
            if (cmd) {
                navigator.clipboard.writeText(cmd).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = "Copied!";
                    setTimeout(() => btn.textContent = originalText, 1800);
                    showToast(`Copied: "${cmd}"`, "📋");
                });
            }
        });
    });

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeGrassModal();
            closeChallengeModal();
            closeSetupModal();
        }
    });

    // Close modals on backdrop click
    [modalGrassMode, modalChallenge, modalSetup].forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    });

});
