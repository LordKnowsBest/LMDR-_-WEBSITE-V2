import {
    createMentorProfile,
    searchMentors,
    requestMentor,
    getMyMatches,
    getMyMentorProfile,
    logMilestone,
    completeMatch,
    respondToRequest
} from 'backend/mentorService';
import { currentUser } from 'wix-users';

$w.onReady(async function () {
    const htmlComponent = $w('#html1'); // Adjust ID as needed

    // Check initialization
    if (!currentUser.loggedIn) {
        console.warn('User not logged in');
        // Redirect or show login prompt
        return;
    }

    // Handle messages from HTML Component
    htmlComponent.onMessage(async (event) => {
        const { action, payload } = event.data;

        try {
            switch (action) {
                case 'loadData':
                    await loadAndSendData(htmlComponent);
                    break;

                case 'requestMentor':
                    await handleRequestMentor(htmlComponent, payload);
                    break;

                case 'createProfile':
                    await handleCreateProfile(htmlComponent, payload);
                    break;

                case 'logMilestone':
                    await handleLogMilestone(htmlComponent, payload);
                    break;

                case 'completeMatch':
                    await handleCompleteMatch(htmlComponent, payload);
                    break;

                case 'respondToRequest':
                    await handleRespondToRequest(htmlComponent, payload);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            htmlComponent.postMessage({
                action: 'error',
                message: error.message
            });
        }
    });

    // Initial load
    // Note: The HTML component sends 'init' when ready, triggering loadData
});

async function loadAndSendData(component) {
    try {
        const [mentorsInfo, matches, myProfile] = await Promise.all([
            searchMentors({}, 50), // Fetch initial list
            getMyMatches(),
            getMyMentorProfile()
        ]);

        // Structure payload for frontend
        const payload = {
            currentUser: {
                id: currentUser.id,
                hasProfile: !!myProfile,
                profile: myProfile
            },
            mentors: mentorsInfo.items,
            matches: matches
        };

        component.postMessage({
            action: 'dataLoaded',
            payload
        });

    } catch (error) {
        console.error('Failed to load mentor data:', error);
        component.postMessage({ action: 'error', message: 'Failed to load data' });
    }
}

async function handleRequestMentor(component, { mentorId, introMessage, goals }) {
    try {
        await requestMentor(mentorId, { introMessage, goals });
        component.postMessage({ action: 'requestSent' });
    } catch (error) {
        console.error('Request failed:', error);
        component.postMessage({ action: 'error', message: error.message });
    }
}

async function handleCreateProfile(component, profileData) {
    try {
        await createMentorProfile(profileData);
        component.postMessage({ action: 'profileCreated' });
    } catch (error) {
        console.error('Profile creation failed:', error);
        component.postMessage({ action: 'error', message: error.message });
    }
}

async function handleLogMilestone(component, { matchId, title }) {
    try {
        await logMilestone(matchId, { title });
        component.postMessage({ action: 'milestoneLogged' });
    } catch (error) {
        console.error('Logging milestone failed:', error);
        component.postMessage({ action: 'error', message: error.message });
    }
}

async function handleCompleteMatch(component, { matchId, feedback, rating }) {
    try {
        await completeMatch(matchId, feedback, rating);
        component.postMessage({ action: 'matchCompleted' });
    } catch (error) {
        console.error('Completing mentorship failed:', error);
        component.postMessage({ action: 'error', message: error.message });
    }
}

async function handleRespondToRequest(component, { matchId, status }) {
    try {
        await respondToRequest(matchId, status);
        // Refresh data
        await loadAndSendData(component);
    } catch (error) {
        console.error('Responding to request failed:', error);
        component.postMessage({ action: 'error', message: error.message });
    }
}
