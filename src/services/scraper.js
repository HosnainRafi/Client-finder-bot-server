// src/services/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

class Scraper {
  async scrapeJobPostings(url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const jobPostings = [];

      $('.job-listing').each((index, element) => {
        const title = $(element).find('.job-title').text().trim();
        const company = $(element).find('.company-name').text().trim();
        const location = $(element).find('.job-location').text().trim();
        const description = $(element).find('.job-description').text().trim();

        jobPostings.push({ title, company, location, description });
      });

      return jobPostings;
    } catch (error) {
      console.error('Error scraping job postings:', error);
      throw new Error('Failed to scrape job postings');
    }
  }

  async scrapeClientInformation(url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const clients = [];

      $('.client-info').each((index, element) => {
        const name = $(element).find('.client-name').text().trim();
        const industry = $(element).find('.client-industry').text().trim();
        const website = $(element).find('.client-website').attr('href');

        clients.push({ name, industry, website });
      });

      return clients;
    } catch (error) {
      console.error('Error scraping client information:', error);
      throw new Error('Failed to scrape client information');
    }
  }
}

module.exports = new Scraper();