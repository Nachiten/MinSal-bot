import { GatewayIntentBits, Client, Events, Collection } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const TOKEN: string = process.env.BOT_TOKEN || "";

const client: any = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// It is triggered when the bot is ready
client.once(Events.ClientReady, (client: Client<true>) => {
  console.log(`[INFO] The bot is ready! Logged in as ${client.user.tag}`);
});

// Logs the bot in discord using the token
client.login(TOKEN).catch((error: any) => {
  console.error("[LOGIN_ERROR] An error has happened: ", error);
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction: any) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// -------------------------------------
// -------------------------------------
// -------------------------------------

// TODO - Move this commands to the new system (commands folder)

// let voteInProgress = false;
// let voteChannel: TextBasedChannel | null;
// let votes = new Map<User, string>();
//
// // Its triggered when someone interacts with an interaction
// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isCommand()) return;
//
//   const { commandName, options, channel, user } = interaction;
//
//   if (commandName === "ping") {
//     await interaction.reply({
//       content: "Pong!",
//       ephemeral: true,
//     });
//   } else if (commandName === "vote-start") {
//     if (voteInProgress) {
//       await interaction.reply({
//         content: "There is already a voting in progress",
//         ephemeral: true,
//       });
//     } else {
//       await interaction.reply({
//         content: `User ${user} started a voting on channel ${channel}, everyone may now vote`,
//         ephemeral: false,
//       });
//       voteInProgress = true;
//       voteChannel = channel;
//     }
//   } else if (commandName === "vote-end") {
//     if (!voteInProgress) {
//       await interaction.reply({
//         content: "There is no voting in progress",
//         ephemeral: true,
//       });
//     } else {
//       const voteResultsEmbed = getVoteResults();
//
//       await interaction.reply({
//         embeds: [voteResultsEmbed],
//         ephemeral: false,
//       });
//
//       resetVariables();
//     }
//   } else if (commandName === "vote") {
//     // Check if vote is in progress
//     if (!voteInProgress) {
//       await interaction.reply({
//         content: "There is no vote in progress",
//         ephemeral: true,
//       });
//       return;
//     }
//
//     // Check if vote is in current channel
//     if (channel !== voteChannel) {
//       await interaction.reply({
//         content: `This is not the current voting channel, go to ${voteChannel} to vote`,
//         ephemeral: true,
//       });
//       return;
//     }
//
//     // Check if user already voted
//     if (votes.has(user)) {
//       await interaction.reply({
//         content: "You already voted",
//         ephemeral: true,
//       });
//       return;
//     }
//
//     // Get vote
//     const vote = options.data[0].value as string;
//
//     // Add vote to map
//     votes.set(user, vote);
//
//     await interaction.reply({
//       content: `${user} has voted. **Total votes: ${votes.size}**`,
//       ephemeral: false,
//     });
//   }
// });
//
// // Its triggered when someone sends a message
// client.on("messageCreate", (message) => {
//   if (message.content === "ping") {
//     void message.reply("pong");
//   }
// });
//
// const getVoteResults = () => {
//   const summedVotes = new Map<string, number>();
//
//   // Sum the number of apparitions of every value from votes, in summed votes
//   votes.forEach((value: string) => {
//     let prevValue = 0;
//
//     if (summedVotes.has(value)) {
//       prevValue = summedVotes.get(value) as number;
//     }
//
//     summedVotes.set(value, prevValue + 1);
//   });
//
//   // Sort summed votes by value decreasing
//   const sortedSummedVotes = new Map(
//     [...summedVotes.entries()].sort((a, b) => b[1] - a[1])
//   );
//
//   let totals = "";
//
//   for (const [vote, numberOfVotes] of sortedSummedVotes) {
//     let word = "votes";
//
//     if (numberOfVotes === 1) {
//       word = "vote";
//     }
//
//     totals += `${vote} - ${numberOfVotes} ${word}\n`;
//   }
//
//   //Order de votes decreasing
//   const orderedVotes = new Map(
//     [...votes.entries()].sort((a, b) => b[1].localeCompare(a[1]))
//   );
//
//   let votesList = "";
//
//   for (const [user, vote] of orderedVotes) {
//     votesList += `${user} voted ${vote}\n`;
//   }
//
//   let result = "**There is a tie for first place. Discussion is needed.**";
//
//   if (sortedSummedVotes.size === 0) result = "**No votes were cast**";
//
//   // If all votes are the same, then that number is the winner
//   if (sortedSummedVotes.size === 1) {
//     const winner = sortedSummedVotes.keys().next().value;
//
//     result = `**${winner} is a winner unanimously**`;
//   }
//
//   // If any vote has more than half the votes, it's the winner
//   else {
//     const firstVote = sortedSummedVotes.values().next().value;
//     const secondVote = sortedSummedVotes.values().next().value;
//
//     if (firstVote > secondVote) {
//       const winner = sortedSummedVotes.keys().next().value;
//       const numberOfVotes = sortedSummedVotes.values().next().value;
//
//       result = `**${winner} has the most votes with ${numberOfVotes}**`;
//     }
//   }
//
//   return new EmbedBuilder()
//     .setColor(0x0099ff)
//     .setTitle("Vote results")
//     .setURL("https://discord.js.org/")
//     .setAuthor({
//       name: "MinSalBot",
//       iconURL:
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Red_Hat_logo.svg/316px-Red_Hat_logo.svg.png",
//     })
//     .setThumbnail(
//       "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Red_Hat_logo.svg/316px-Red_Hat_logo.svg.png"
//     )
//     .addFields(
//       { name: "Totals:", value: totals || "There are no votes" },
//       { name: "Votes list:", value: votesList || "There are no votes" },
//       { name: "Result:", value: result || "Error" }
//     )
//     .setTimestamp()
//     .setFooter({ text: "Created by Nachiten" });
// };
//
// const resetVariables = () => {
//   voteInProgress = false;
//   voteChannel = null;
//   votes = new Map<User, string>();
// };
