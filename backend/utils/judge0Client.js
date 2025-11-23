// FILE: backend/utils/judge0Client.js
// Create this new file in your backend folder
import axios from "axios";

const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";

class Judge0Client {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minDelayBetweenRequests = 500; // 500ms between requests to avoid rate limits
  }

  // Main method to submit code (returns a Promise)
  async executeCode(codeData) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ codeData, resolve, reject });
      this.processQueue();
    });
  }

  // Process queue one request at a time
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    const { codeData, resolve, reject } = this.requestQueue.shift();

    try {
      // Wait minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        await new Promise(r => 
          setTimeout(r, this.minDelayBetweenRequests - timeSinceLastRequest)
        );
      }

      // Submit with exponential backoff retry
      const result = await this.submitWithRetry(codeData);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.lastRequestTime = Date.now();
      
      // Process next item in queue
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  // Exponential backoff retry logic
  async submitWithRetry(codeData, retries = 0, maxRetries = 5) {
    try {
      const response = await axios.post(
        `https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`,
        codeData,
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-key": process.env.RAPID_API_KEY,
            "x-rapidapi-host": JUDGE0_HOST,
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      // Check if it's a rate limit error (429)
      if (error.response?.status === 429 && retries < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delayMs = Math.pow(2, retries) * 1000;
        console.log(`Rate limited. Retrying in ${delayMs}ms (attempt ${retries + 1}/${maxRetries})`);
        
        await new Promise(r => setTimeout(r, delayMs));
        return this.submitWithRetry(codeData, retries + 1, maxRetries);
      }

      // For other errors or max retries exceeded
      throw error;
    }
  }

  // Get queue status (useful for debugging)
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

export default new Judge0Client();