// ==========================================
// VOICE BASED EMAIL SYSTEM
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let isRunning = false;


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const startButton = document.getElementById("startButton");
const statusBox = document.getElementById("status");

const receiverBox = document.getElementById("receiver");
const subjectBox = document.getElementById("subject");
const messageBox = document.getElementById("message");
const photoBox = document.getElementById("photo");


// ==========================================
// SPEAK FUNCTION
// ==========================================

function speak(text) {

    return new Promise((resolve) => {

        window.speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "en-IN";
        speech.rate = 0.9;
        speech.pitch = 1;

        speech.onend = () => {
            resolve();
        };

        speech.onerror = () => {
            resolve();
        };

        window.speechSynthesis.speak(speech);
    });
}


// ==========================================
// LISTEN FUNCTION
// ==========================================

function listen() {

    return new Promise((resolve, reject) => {

        if (!SpeechRecognition) {

            alert(
                "Speech Recognition is not supported. Please use Google Chrome."
            );

            reject("Speech recognition not supported");
            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        statusBox.innerText =
            "🎤 Listening... Please speak now";

        let finished = false;

        recognition.onresult = function (event) {

            if (finished) return;

            finished = true;

            const text =
                event.results[0][0].transcript;

            statusBox.innerText =
                "You said: " + text;

            console.log(
                "Speech recognized:",
                text
            );

            recognition.stop();

            setTimeout(() => {
                resolve(text);
            }, 300);
        };

        recognition.onerror = function (event) {

            if (finished) return;

            finished = true;

            console.log(
                "Speech error:",
                event.error
            );

            statusBox.innerText =
                "Please try again";

            reject(event.error);
        };

        recognition.onend = function () {

            console.log(
                "Listening ended"
            );
        };

        try {

            recognition.start();

        } catch (error) {

            console.log(
                "Recognition start error:",
                error
            );

            reject(error);
        }
    });
}


// ==========================================
// ASK QUESTION
// ==========================================

async function ask(question) {

    await speak(question);

    await new Promise(resolve =>
        setTimeout(resolve, 700)
    );

    try {

        const answer =
            await listen();

        return answer;

    } catch (error) {

        await speak(
            "I could not hear you. Please try again."
        );

        return await ask(question);
    }
}


// ==========================================
// YES / NO CONFIRMATION
// ==========================================

async function askYesNo(question) {

    while (true) {

        const answer =
            await ask(question);

        const text =
            answer
                .toLowerCase()
                .trim()
                .replace(/[.,!?]/g, "");

        console.log(
            "Confirmation detected:",
            text
        );

        // CORRECT / YES
        if (
            text === "correct" ||
            text === "right" ||
            text === "yes" ||
            text === "yeah" ||
            text === "yep"
        ) {

            console.log(
                "CORRECT detected"
            );

            return "yes";
        }

        // INCORRECT / NO
        if (
            text === "incorrect" ||
            text === "wrong" ||
            text === "no" ||
            text === "nope"
        ) {

            console.log(
                "INCORRECT detected"
            );

            return "no";
        }

        await speak(
            "Please say correct or incorrect."
        );

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        );
    }
}


// ==========================================
// EMAIL NORMALIZATION
// ==========================================

function normalizeEmail(text) {

    let email =
        text.toLowerCase().trim();

    // Speech words → email symbols
    email = email
        .replace(/at the rate/g, "@")
        .replace(/attherate/g, "@")
        .replace(/at/g, "@")
        .replace(/dot/g, ".")
        .replace(/underscore/g, "_")
        .replace(/hyphen/g, "-")
        .replace(/dash/g, "-");

    // Remove spaces after converting words
    email =
        email.replace(/\s+/g, "");

    // Common Gmail mistakes
    email = email
        .replace(/gamil/g, "gmail")
        .replace(/gmal/g, "gmail")
        .replace(/gmial/g, "gmail")
        .replace(/gmailcom/g, "gmail.com")
        .replace(/gmail\.com\.com/g, "gmail.com");

    // Yahoo
    email = email
        .replace(/yahoomail/g, "yahoo")
        .replace(/yahoo\.com\.com/g, "yahoo.com");

    // Outlook
    email = email
        .replace(/outlookcom/g, "outlook.com");

    // Common .com mistakes
    email = email
        .replace(/\.cim/g, ".com")
        .replace(/\.cm/g, ".com")
        .replace(/\.con/g, ".com")
        .replace(/\.comm/g, ".com")
        .replace(/\.coom/g, ".com")
        .replace(/\.comn/g, ".com");

    email =
        email.replace(/@+/g, "@");

    email =
        email.replace(/\.+/g, ".");

    return email;
}


// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(email);
}


// ==========================================
// NUMBER WORD CONVERSION
// ==========================================

function convertNumberWords(text) {

    const numbers = {

        zero: "0",
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9"

    };

    let words =
        text.split(/\s+/);

    words =
        words.map(word => {

            return numbers[word] || word;

        });

    return words.join("");
}


// ==========================================
// RECEIVER STEP
// ==========================================

async function receiverStep() {

    while (true) {

        const spokenEmail =
            await ask(
                "Please say the receiver email address slowly. For example, say username at gmail dot com."
            );

        let email =
            normalizeEmail(spokenEmail);

        email =
            convertNumberWords(email);

        receiverBox.value =
            email;

        console.log(
            "Normalized email:",
            email
        );

        if (!isValidEmail(email)) {

            await speak(
                "The email address does not look correct. Please say it again."
            );

            continue;
        }

        const confirmation =
            await askYesNo(
                "You said " +
                email +
                ". Is this email address correct? Please say correct or incorrect."
            );

        if (confirmation === "yes") {

            await speak(
                "Receiver email confirmed."
            );

            await new Promise(resolve =>
                setTimeout(resolve, 700)
            );

            await subjectStep();

            return;

        } else {

            await speak(
                "Okay. Please say the receiver email address again."
            );
        }
    }
}


// ==========================================
// SUBJECT STEP
// ==========================================

async function subjectStep() {

    while (true) {

        const subject =
            await ask(
                "Please say the subject of the email."
            );

        subjectBox.value =
            subject;

        const confirmation =
            await askYesNo(
                "You said " +
                subject +
                ". Is the subject correct? Please say correct or incorrect."
            );

        if (confirmation === "yes") {

            await speak(
                "Subject confirmed."
            );

            await new Promise(resolve =>
                setTimeout(resolve, 700)
            );

            await messageStep();

            return;

        } else {

            await speak(
                "Okay. Please say the subject again."
            );
        }
    }
}


// ==========================================
// MESSAGE STEP
// ==========================================

async function messageStep() {

    while (true) {

        const message = await ask(
            "Please speak your email message."
        );

        messageBox.value = message;

        // Read the complete message aloud
        await speak(
            "You said: " + message
        );

        const confirmation = await askYesNo(
            "Is the message correct or incorrect? Please say correct or incorrect."
        );

        if (confirmation === "yes") {

            await speak(
                "Message confirmed."
            );

            await new Promise(resolve =>
                setTimeout(resolve, 700)
            );

            await attachmentStep();

            return;

        } else {

            await speak(
                "The message is incorrect. Please speak the message again."
            );

            messageBox.value = "";
        }
    }
}




// ==========================================
// ATTACHMENT STEP
// ==========================================

async function attachmentStep() {

    while (true) {

        const answer = await ask(
            "Would you like to attach a photo? Please say attach or skip."
        );

        const text = answer
            .toLowerCase()
            .trim()
            .replace(/[.,!?]/g, "");

        console.log("Attachment answer:", text);

        // ATTACH
        if (
            text === "attach" ||
            text.includes("attach it") ||
            text === "photo"
        ) {

            await speak(
                "Please select a photo."
            );

            statusBox.innerText =
                "📷 Please select a photo";

            photoBox.click();

            await new Promise(resolve => {

                photoBox.onchange = function () {
                    resolve();
                };

                setTimeout(resolve, 15000);
            });

            if (
                photoBox.files &&
                photoBox.files.length > 0
            ) {

                await speak(
                    "Photo selected successfully."
                );

            } else {

                await speak(
                    "No photo was selected."
                );
            }

            break;
        }

        // SKIP
        if (
            text === "skip" ||
            text.includes("skip it") ||
            text === "no"
        ) {

            await speak(
                "Okay. No photo will be attached."
            );

            break;
        }

        await speak(
            "Please say attach or skip."
        );
    }

    await new Promise(resolve =>
        setTimeout(resolve, 700)
    );

    await readEmail();
}

// ==========================================
// READ COMPLETE EMAIL
// ==========================================

async function readEmail() {

    let text =
        "Here is your complete email. ";

    text +=
        "Receiver is " +
        receiverBox.value +
        ". ";

    text +=
        "Subject is " +
        subjectBox.value +
        ". ";

    text +=
        "Message is " +
        messageBox.value +
        ". ";

    if (
        photoBox.files &&
        photoBox.files.length > 0
    ) {

        text +=
            "A photo is attached. ";

    } else {

        text +=
            "No photo is attached. ";
    }

    await speak(text);

    const answer =
        await ask(
            "Would you like to send the email? Please say send or cancel."
        );

    const result =
        answer
            .toLowerCase()
            .trim()
            .replace(/[.,!?]/g, "");

    console.log(
        "Final send answer:",
        result
    );

    if (
        result.includes("send") ||
        result.includes("sent") ||
        result.includes("yes")
    ) {

        await speak(
            "Okay. Sending the email now."
        );

        await sendEmail();

    } else if (
        result.includes("cancel") ||
        result.includes("no")
    ) {

        await speak(
            "Okay. Email cancelled."
        );

        statusBox.innerText =
            "❌ Email cancelled";

        isRunning = false;

        if (startButton) {
            startButton.disabled = false;
        }

    } else {

        await speak(
            "Please say send or cancel."
        );

        await readEmail();
    }
}


// ==========================================
// SEND EMAIL
// ==========================================

async function sendEmail() {

    console.log("SEND EMAIL FUNCTION CALLED");

    statusBox.innerText =
        "📧 Sending email...";

    await speak(
        "Sending your email now."
    );
    const formData =
        new FormData();

    formData.append(
        "email",
        receiverBox.value
    );

    formData.append(
        "subject",
        subjectBox.value
    );

    formData.append(
        "message",
        messageBox.value
    );

    if (
        photoBox.files &&
        photoBox.files.length > 0
    ) {

        formData.append(
            "photo",
            photoBox.files[0]
        );
    }

    try {

        const response =
            await fetch("/send", {

                method: "POST",

                body: formData
            });

        const result =
            await response.json();

        console.log(
            "Send result:",
            result
        );

        if (result.success) {

    statusBox.innerText =
        "✅ Email sent successfully";

    await speak(
        "Email sent successfully."
    );

    // Open Email Success Page
    window.location.href = "/success";

} else {

            statusBox.innerText =
                "❌ Email sending failed";

            await speak(
                "Email could not be sent."
            );

            console.log(
                "Send error:",
                result.message
            );
        }

    } catch (error) {

        console.log(
            "Server error:",
            error
        );

        statusBox.innerText =
            "❌ Server error";

        await speak(
            "There was a server error while sending the email."
        );
    }

    isRunning = false;

    if (startButton) {
        startButton.disabled = false;
    }
}


// ==========================================
// START VOICE SYSTEM
// ==========================================

async function startVoice() {

    if (isRunning) {
        return;
    }

    isRunning = true;

    if (startButton) {
        startButton.disabled = true;
    }

    statusBox.innerText =
        "🎤 Voice system started";

    receiverBox.value = "";
    subjectBox.value = "";
    messageBox.value = "";

    if (photoBox) {
        photoBox.value = "";
    }

    try {

        await speak(
            "Welcome to Voice Based Email System."
        );

        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );

        await receiverStep();

    } catch (error) {

        console.log(
            "Voice system error:",
            error
        );

        statusBox.innerText =
            "❌ Voice system error";

        await speak(
            "Something went wrong. Please try again."
        );

        isRunning = false;

        if (startButton) {
            startButton.disabled = false;
        }
    }
}


// ==========================================
// MANUAL RECEIVER BUTTON
// ==========================================

const receiverBtn =
    document.getElementById("receiverBtn");

if (receiverBtn) {

    receiverBtn.addEventListener(
        "click",
        async function () {

            const email =
                await ask(
                    "Please say the receiver email address."
                );

            receiverBox.value =
                normalizeEmail(email);
        }
    );
}


// ==========================================
// MANUAL SUBJECT BUTTON
// ==========================================

const subjectBtn =
    document.getElementById("subjectBtn");

if (subjectBtn) {

    subjectBtn.addEventListener(
        "click",
        async function () {

            const subject =
                await ask(
                    "Please say the subject."
                );

            subjectBox.value =
                subject;
        }
    );
}


// ==========================================
// MANUAL MESSAGE BUTTON
// ==========================================

const messageBtn =
    document.getElementById("messageBtn");

if (messageBtn) {

    messageBtn.addEventListener(
        "click",
        async function () {

            const message =
                await ask(
                    "Please speak your message."
                );

            messageBox.value =
                message;
        }
    );
}


// ==========================================
// READ BUTTON
// ==========================================

const readBtn =
    document.getElementById("readBtn");

if (readBtn) {

    readBtn.addEventListener(
        "click",
        async function () {

            await readEmail();
        }
    );
}


// ==========================================
// CORRECTION BUTTON
// ==========================================

const correctionBtn =
    document.getElementById("correctionBtn");

if (correctionBtn) {

    correctionBtn.addEventListener(
        "click",
        function () {

            receiverBox.value =
                normalizeEmail(
                    receiverBox.value
                );
        }
    );
}


// ==========================================
// SEND BUTTON
// ==========================================

const sendBtn =
    document.getElementById("sendBtn");

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async function () {

            await sendEmail();
        }
    );
}