import { getProjects, getProjectById } from './lib/api/index.js';

async function test() {
    try {
        console.log("Fetching projects...");
        const projects = await getProjects();
        if (projects.length === 0) {
            console.log("No projects found.");
            return;
        }
        const first = projects[0];
        console.log("First project ID:", first.id);

        console.log("Fetching project details...");
        const details = await getProjectById(first.id);
        console.log("Success:", !!details);
    } catch (e) {
        console.error("Test failed with error:", e);
    }
}
test();
