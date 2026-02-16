import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { sendWelcomeEmail, sendNewsEmail } from "../nodemailer";
import { step } from "inngest";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const {
      data: { email, name },
    } = event;
    if (!email || !name) {
      throw new Error("Missing required user data: email or name");
    }

    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Bunseki. You now have the tools to track markets and make smarter moves.";

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step 1: Fetch all users for news email
    const users = await step.run("get-all-users", async () =>
      getAllUsersForNewsEmail(),
    );

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found for daily news summary",
      };
    }

    // Step 2: Fetch personalized news for each user
    const newsPerUser = await step.run("fetch-user-news", async () => {
      try {
        const newsMap: {
          [userId: string]: {
            user: { id: string; email: string; name: string };
            news: MarketNewsArticle[];
          };
        } = {};

        for (const user of users) {
          try {
            // Get user's watchlist symbols
            const symbols = await getWatchlistSymbolsByEmail(user.email);

            // Fetch news for symbols or general news if none
            const news = await getNews(
              symbols && symbols.length > 0 ? symbols : undefined,
            );

            newsMap[user.id] = {
              user,
              news: news.slice(0, 6), // Max 6 articles per user
            };
          } catch (error) {
            console.error(`Error fetching news for user ${user.email}:`, error);
            // Fallback to general news on error
            try {
              const generalNews = await getNews();
              newsMap[user.id] = {
                user,
                news: generalNews.slice(0, 6),
              };
            } catch (fallbackError) {
              console.error(
                `Fallback news fetch failed for ${user.email}:`,
                fallbackError,
              );
              // If even general news fails, skip this user
              newsMap[user.id] = {
                user,
                news: [],
              };
            }
          }
        }

        return newsMap;
      } catch (error) {
        console.error("Fatal error in fetch-user-news step:", error);
        throw error;
      }
    });

    // Step 3: Summarize news via AI
    const summaryPromises: Promise<{
      userId: string;
      user: { id: string; email: string; name: string };
      summary: string;
    }>[] = [];

    for (const [userId, { user, news }] of Object.entries(newsPerUser)) {
      if (news.length === 0) {
        summaryPromises.push(
          Promise.resolve({
            userId,
            user,
            summary: "No news available today.",
          }),
        );
        continue;
      }

      const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
        "{{newsData}}",
        JSON.stringify(news),
      );

      const summaryPromise = (async () => {
        try {
          const response = await step.ai.infer(`summarize-news-${userId}`, {
            model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
            body: {
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0];
          const newsContent =
            (part && "text" in part ? part.text : null) || "No market news.";

          return {
            userId,
            user,
            summary: newsContent,
          };
        } catch (error) {
          console.error(
            `Error summarizing news for user ${user.email}:`,
            error,
          );
          return {
            userId,
            user,
            summary: "Unable to summarize news. Please check back later.",
          };
        }
      })();

      summaryPromise.catch((error) => {
        console.error(`Promise error for ${user.email}:`, error);
      });

      summaryPromises.push(summaryPromise);
    }

    const summariesArray = await Promise.all(summaryPromises);
    const summaries: {
      [userId: string]: {
        user: { id: string; email: string; name: string };
        summary: string;
      };
    } = {};

    summariesArray.forEach(({ userId, user, summary }) => {
      summaries[userId] = { user, summary };
    });

    // Step 4: Send emails
    await step.run("send-news-emails", async () => {
      try {
        await Promise.all(
          Object.entries(summaries).map(async ([userId, { user, summary }]) => {
            try {
              return await sendNewsEmail({
                email: user.email,
                name: user.name,
                summary: summary || "No news available today.",
              });
            } catch (error) {
              console.error(`Error sending email to ${user.email}:`, error);
              // Don't rethrow - allow other emails to be sent
            }
          }),
        );
      } catch (error) {
        console.error("Fatal error in send-news-emails step:", error);
        throw error;
      }
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  },
);
