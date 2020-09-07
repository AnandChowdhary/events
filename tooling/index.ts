import { readFile, writeFile, readdir } from "fs-extra";
import { join } from "path";

interface Event {
  name: string;
  date: Date;
  venue: string;
  location: string;
}

const parseEventFile = async (year: string, file: string): Promise<Event> => {
  // const contents = await readFile(join(".", "events", year, file), "utf-8");
  return {
    name: "An event",
    date: new Date(),
    venue: "A venue",
    location: "A location",
  };
};

export const generateReadme = async () => {
  const allEvents: { [index: string]: Array<Event> } = {};
  let pastEvents = "";
  let upcomingEvents = "";
  const years = await readdir(join(".", "events"));
  for await (const year of years) {
    const events = await readdir(join(".", "events", year));
    for await (const event of events) {
      allEvents[year] = allEvents[year] ?? [];
      allEvents[year].push(await parseEventFile(year, event));
    }
  }
  Object.keys(allEvents).forEach((year) => {
    allEvents[year].forEach((event) => {
      const isPast = new Date(event.date).getTime() < new Date().getTime();
      const text = `- **${event.name}**, ${new Date(
        event.date
      ).toLocaleDateString("en-us", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}  \n${event.venue}, ${event.location}\n\n`;
      if (isPast) pastEvents += text;
      else upcomingEvents += text;
    });
  });
  let content = "";
  if (upcomingEvents.length)
    content += `## Upcoming events\n\n${upcomingEvents}`;
  if (pastEvents.length) content += `## Past events\n\n${pastEvents}`;
  let readmeContents = await readFile(join(".", "README.md"), "utf-8");
  await writeFile(
    join(".", "README.md"),
    `${
      readmeContents.split("<!--events-->")[0]
    }<!--events-->\n${content.trim()}\n<!--/events-->${
      readmeContents.split("<!--/events-->")[1]
    }`
  );
};

generateReadme();
