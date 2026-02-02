// src/pages/CommunityForums_Bridge_Reference.js
// COPY THIS CODE INTO THE VELO PAGE CODE FOR "Community Forums"

import { getCategories, getThreadsByCategory, getThreadBySlug, getPostsByThread, createThread, createPost, likePost } from 'backend/forumService';
import { reportPost } from 'backend/moderationService';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

$w.onReady(function () {
    const htmlComponent = $w('#html1'); // Ensure your HTML component ID matches

    // Handle messages from HTML
    htmlComponent.onMessage(async (event) => {
        const { type, payload } = event.data;

        try {
            switch (type) {
                case 'ready':
                    // Initial load handled by getCategories
                    break;

                case 'getCategories':
                    const categories = await getCategories();
                    htmlComponent.postMessage({ type: 'categoriesData', payload: { items: categories } });
                    break;

                case 'getThreads':
                    const threads = await getThreadsByCategory(payload.categoryId);
                    // We need to pass the category details back for the header
                    // Ideally getThreadsByCategory returns { items, totalCount }, we might need to fetch category separately or adjust backend
                    // Backend returns { items, totalCount }. We need category metadata.
                    // Let's fetch category too if slug/id provided.
                    // Optimization: Backend could return it. For now, fetch separately or rely on cached frontend state.
                    // Let's just return threads. Frontend has categories cached.
                    // Wait, frontend needs 'category' object in payload for header title.
                    // We can fetch category by ID from the list we sent earlier, OR fetch here.
                    // Let's assume frontend handles it or we fetch it.
                    // To be safe, let's just send threads. Frontend logic: renderThreadList(category) -> needs category object.
                    // We can't easily get category object from just ID without a call.
                    // Let's fetch category from backend too.
                    // BUT forumService.getThreadsByCategory only returns threads.
                    // We'll trust frontend cache for now, or add a getCategoryById if needed.
                    // Frontend 'getThreads' sends categoryId. Frontend has currentState.categories. It can find it.
                    // *Correction*: Frontend `renderThreadList` takes `payload.category`.
                    // So we MUST send category.
                    // We can cheat: look up in the categories we just fetched? No, stateless.
                    // Let's import getCategoryBySlug or similar? No getCategoryById exposed?
                    // getCategories returns all. We can filter.
                    const allCats = await getCategories();
                    const currentCat = allCats.find(c => c._id === payload.categoryId);
                    
                    htmlComponent.postMessage({ 
                        type: 'threadsData', 
                        payload: { 
                            items: threads.items, 
                            category: currentCat 
                        } 
                    });
                    break;

                case 'getThreadBySlug':
                    const thread = await getThreadBySlug(payload.slug);
                    const posts = await getPostsByThread(thread._id);
                    htmlComponent.postMessage({ 
                        type: 'threadDetailData', 
                        payload: { 
                            thread: thread, 
                            posts: posts.items 
                        } 
                    });
                    break;

                case 'getPosts':
                    const threadPosts = await getPostsByThread(payload.threadId);
                    // We might need thread details if we only had ID
                    // But usually we enter from list.
                    // If deep linking, we need thread details.
                    // Let's assume we have them or fetch them.
                    htmlComponent.postMessage({ 
                        type: 'postsData', 
                        payload: { items: threadPosts.items } 
                    });
                    break;

                case 'createThread':
                    const newThread = await createThread(payload);
                    htmlComponent.postMessage({ type: 'threadCreated', payload: newThread });
                    break;

                case 'createPost':
                    const newPost = await createPost(payload);
                    htmlComponent.postMessage({ type: 'postCreated', payload: newPost });
                    break;

                case 'likePost':
                    await likePost(payload.postId);
                    // No return payload needed for optimistic UI, but could send updated count
                    break;
                
                case 'reportPost':
                    await reportPost(payload.postId, 'user_report', 'Reported via frontend');
                    break;
            }
        } catch (error) {
            console.error('Forum Bridge Error:', error);
            htmlComponent.postMessage({ type: 'error', payload: error.message });
        }
    });
});
