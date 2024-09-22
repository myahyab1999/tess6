const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { DateTime } = require("luxon");

class Fintopio {
  constructor() {
    this.baseUrl = "https://fintopio-tg.fintopio.com/api";
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://fintopio-tg.fintopio.com/",
      "Sec-Ch-Ua":
        '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
    };
  }

  log(msg) {
    console.log(msg);
  }

  async waitWithCountdown(seconds) {
    const spinners = ["|", "/", "-", "\\"];
    let i = 0;
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;
    for (let s = seconds; s >= 0; s--) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(
        `\r${spinners[i]} Waiting ${hours}h ${minutes}m ${remainingSeconds}s to continue ${spinners[i]}`
      );
      i = (i + 1) % spinners.length;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      remainingSeconds--;
      if (remainingSeconds < 0) {
        remainingSeconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
      }
    }
    console.log("");
  }

  async auth(userData) {
    const url = `${this.baseUrl}/auth/telegram`;
    const headers = { ...this.headers, Webapp: "true" };

    try {
      const response = await axios.get(`${url}?${userData}`, { headers });
      return response.data.token;
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Authentication error: ${error.message}`
      );
      return null;
    }
  }

  async getProfile(token) {
    const url = `${this.baseUrl}/referrals/data`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      Webapp: "false, true",
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error fetching profile: ${error.message}`
      );
      return null;
    }
  }

  async checkInDaily(token) {
    const url = `${this.baseUrl}/daily-checkins`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      await axios.post(url, {}, { headers });
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Daily check-in successful!`
      );
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Daily check-in error: ${error.message}`
      );
    }
  }

  async getFarmingState(token) {
    const url = `${this.baseUrl}/farming/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error fetching farming state: ${error.message}`
      );
      return null;
    }
  }

  async startFarming(token) {
    const url = `${this.baseUrl}/farming/farm`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(url, {}, { headers });
      const finishTimestamp = response.data.timings.finish;

      if (finishTimestamp) {
        const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(
          DateTime.DATETIME_FULL
        );
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Starting farm...`
        );
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Farming completion time: ${finishTime}`
        );
      } else {
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - No completion time available.`
        );
      }
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error starting farming: ${error.message}`
      );
    }
  }

  async claimFarming(token) {
    const url = `${this.baseUrl}/farming/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      await axios.post(url, {}, { headers });
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Farm claimed successfully!`
      );
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error claiming farm: ${error.message}`
      );
    }
  }

  async getDiamondInfo(token) {
    const url = `${this.baseUrl}/clicker/diamond/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.get(url, { headers });
      if (response.data && response.data.state) {
        return response.data;
      } else {
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error fetching diamond state: Invalid response data`
        );
        return null;
      }
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error fetching diamond state: ${error.message}`
      );
      return null;
    }
  }

  async claimDiamond(token, diamondNumber, totalReward) {
    const url = `${this.baseUrl}/clicker/diamond/complete`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const payload = { diamondNumber: diamondNumber };

    try {
      await axios.post(url, payload, { headers });
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Success claim ${totalReward} diamonds!`
      );
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error claiming Diamond: ${error.message}`
      );
    }
  }

  async getTask(token) {
    const url = `${this.baseUrl}/hold/tasks`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error fetching task state: ${error.message}`
      );
      return null;
    }
  }

  async startTask(token, taskId, slug) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/start`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
      origin: "https://fintopio-tg.fintopio.com",
    };
    try {
      await axios.post(url, {}, { headers });
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Starting task ${slug}!`
      );
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error starting task: ${error.message}`
      );
    }
  }

  async claimTask(token, taskId, slug, rewardAmount) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
      origin: "https://fintopio-tg.fintopio.com",
    };
    try {
      await axios.post(url, {}, { headers });
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Task ${slug} complete, reward ${rewardAmount} diamonds!`
      );
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error claiming task: ${error.message}`
      );
    }
  }

  extractusername(userData) {
    try {
      const userPart = userData.match(/user=([^&]*)/)[1];
      const decodedUserPart = decodeURIComponent(userPart);
      const userObj = JSON.parse(decodedUserPart);
      return userObj.username || "Unknown";
    } catch (error) {
      this.log(
        `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error extracting username: ${error.message}`
      );
      return "Unknown";
    }
  }

  calculateWaitTime(firstAccountFinishTime) {
    if (!firstAccountFinishTime) return null;

    const now = DateTime.now();
    const finishTime = DateTime.fromMillis(firstAccountFinishTime);
    const duration = finishTime.diff(now);

    return duration.as("milliseconds");
  }

  async main() {
    while (true) {
      const dataFile = path.join(__dirname, "data.txt");
      const data = await fs.readFile(dataFile, "utf8");
      const users = data.split("\n").filter(Boolean);

      let firstAccountFinishTime = null;

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        const username = this.extractusername(userData);
        this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - [ Account ${
            i + 1
          } | ${username} ]`
        );
        const token = await this.auth(userData);
        if (token) {
          this.log(
            `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Login successful!`
          );
          const profile = await this.getProfile(token);
          if (profile) {
            const balance = profile.balance;
            this.log(
              `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Balance: ${balance}`
            );

            await this.checkInDaily(token);

            try {
              const diamond = await this.getDiamondInfo(token);
              if (diamond && diamond.state === "available") {
                await this.waitWithCountdown(
                  Math.floor(Math.random() * (21 - 10)) + 10
                );
                await this.claimDiamond(
                  token,
                  diamond.diamondNumber,
                  diamond.settings.totalReward
                );
              } else if (diamond && diamond.timings && diamond.timings.nextAt) {
                const nextDiamondTimeStamp = diamond.timings.nextAt;
                const nextDiamondTime = DateTime.fromMillis(
                  nextDiamondTimeStamp
                ).toLocaleString(DateTime.DATETIME_FULL);
                this.log(
                  `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Next Diamond time: ${nextDiamondTime}`
                );

                if (i === 0) {
                  firstAccountFinishTime = nextDiamondTimeStamp;
                }
              } else {
                this.log(
                  `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Unable to process diamond info`
                );
              }
            } catch (error) {
              this.log(
                `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Error processing diamond info: ${error.message}`
              );
            }

            const farmingState = await this.getFarmingState(token);

            if (farmingState) {
              if (farmingState.state === "idling") {
                await this.startFarming(token);
              } else if (
                farmingState.state === "farmed" ||
                farmingState.state === "farming"
              ) {
                const finishTimestamp = farmingState.timings.finish;
                if (finishTimestamp) {
                  const finishTime = DateTime.fromMillis(
                    finishTimestamp
                  ).toLocaleString(DateTime.DATETIME_FULL);
                  this.log(
                    `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Farming completion time: ${finishTime}`
                  );

                  //   if (i === 0) {
                  //     firstAccountFinishTime = finishTimestamp;
                  //   }

                  const currentTime = DateTime.now().toMillis();
                  if (currentTime > finishTimestamp) {
                    await this.claimFarming(token);
                    await this.startFarming(token);
                  }
                }
              }
            }

            const taskState = await this.getTask(token);

            if (taskState) {
              for (const item of taskState.tasks) {
                if (item.status === "available") {
                  await this.startTask(token, item.id, item.slug);
                } else if (item.status === "verified") {
                  await this.claimTask(
                    token,
                    item.id,
                    item.slug,
                    item.rewardAmount
                  );
                } else if (item.status === "in-progress") {
                  continue;
                } else {
                  this.log(
                    `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - Veryfing task ${item.slug}!`
                  );
                }
              }
            }
          }
        }
      }

      const waitTime = this.calculateWaitTime(firstAccountFinishTime);
      if (waitTime && waitTime > 0) {
        await this.waitWithCountdown(Math.floor(waitTime / 1000));
      } else {
        this.log(
          `[${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}] - No valid wait time, continuing loop immediately.`
        );
        await this.waitWithCountdown(5);
      }
    }
  }
}

if (require.main === module) {
  const fintopio = new Fintopio();
  fintopio.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}