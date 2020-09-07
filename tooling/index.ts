import { readFile, writeFile, readdir } from "fs-extra";
import { join } from "path";

interface Event {
  slug: string;
  name: string;
  date: Date;
  venue: string;
  city: string;
}

const parseEventFile = async (year: string, file: string): Promise<Event> => {
  const lines = (
    await readFile(join(".", "events", year, file), "utf-8")
  ).split("\n");
  return {
    slug: file,
    name:
      lines.find((line) => line.startsWith("title: "))?.split("title: ")[1] ??
      lines.find((line) => line.startsWith("# ")).split("# ")[1],
    date: new Date(
      lines.find((line) => line.startsWith("date: "))?.split("date: ")[1]
    ),
    venue: lines
      .find((line) => line.startsWith("venue: "))
      ?.split("venue: ")[1],
    city: lines.find((line) => line.startsWith("city: "))?.split("city: ")[1],
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
  Object.keys(allEvents)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach((year) => {
      allEvents[year] = allEvents[year].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      let addedYears: Array<string> = [];
      allEvents[year].forEach((event) => {
        const isPast = new Date(event.date).getTime() < new Date().getTime();
        const text = `${
          addedYears.includes(year) ? "" : `### ${year}\n\n`
        }- [**${event.name}**](./events/${year}/${event.slug}), ${new Date(
          event.date
        ).toLocaleDateString("en-us", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}  \n  ${event.venue}, ${event.city}\n\n`;
        if (isPast) pastEvents += text;
        else upcomingEvents += text;
        addedYears.push(year);
      });
    });
  let content = "";
  if (upcomingEvents.length)
    content += `## 🔮 Upcoming events\n\n${upcomingEvents}`;
  if (pastEvents.length) content += `## 📜 Past events\n\n${pastEvents}`;
  let readmeContents = await readFile(join(".", "README.md"), "utf-8");
  await writeFile(
    join(".", "README.md"),
    `${
      readmeContents.split("<!--events-->")[0]
    }<!--events-->\n\n${content.trim()}\n<!--/events-->${
      readmeContents.split("<!--/events-->")[1]
    }`
  );
};

generateReadme();
