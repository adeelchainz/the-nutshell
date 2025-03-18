import { Command } from "commander";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const program = new Command();
const REGISTRY_URL = "https://your-registry.com/components.json"; // Placeholder URL
const COMPONENTS_DIR = path.join(process.cwd(), "components");

// Ensure components directory exists
if (!fs.existsSync(COMPONENTS_DIR)) {
  fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
}

program
  .name("mycli")
  .description("A CLI for managing UI components")
  .version("0.1.0");

// List available components
program
  .command("list")
  .description("List available components")
  .action(async () => {
    try {
      const response = await fetch(REGISTRY_URL);
      const data = await response.json();
      console.log("Available components:");
      data.components.forEach((c) => console.log(`- ${c.name}`));
    } catch (error) {
      console.error("Error fetching registry:", error);
    }
  });

// Add a component
program
  .command("add <component>")
  .description("Add a component to your project")
  .action(async (component) => {
    try {
      const response = await fetch(REGISTRY_URL);
      const data = await response.json();
      const comp = data.components.find((c) => c.name === component);
      if (!comp) {
        console.error("Component not found.");
        return;
      }

      const compResponse = await fetch(comp.path);
      const compCode = await compResponse.text();

      const compPath = path.join(COMPONENTS_DIR, `${component}.tsx`);
      fs.writeFileSync(compPath, compCode);
      console.log(`Component ${component} added successfully.`);
    } catch (error) {
      console.error("Error adding component:", error);
    }
  });

program.parse(process.argv);
