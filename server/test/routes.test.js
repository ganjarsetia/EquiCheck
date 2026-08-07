import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import * as scanService from '../src/services/scanService.js';

const app = createApp();

describe('POST /api/scan', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app).post('/api/scan').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app).post('/api/scan').send({});
    expect(res.status).toBe(400);
  });

  it('returns normalized violations for a valid URL', async () => {
    const rawViolation = {
      id: 'image-alt',
      impact: 'serious',
      description: 'desc',
      help: 'help',
      helpUrl: 'https://example.com/help',
      tags: ['wcag2a'],
      nodes: [
        {
          html: '<img src="x" />',
          target: ['img'],
          failureSummary: 'Fix all of the following',
          any: [{ id: 'alt', message: 'Element does not have alt' }],
          all: [],
          none: [],
        },
      ],
    };

    vi.spyOn(scanService, 'scanUrl').mockResolvedValue({
      violations: [rawViolation],
      pageTitle: 'Example',
    });

    const res = await request(app).post('/api/scan').send({ url: 'https://example.com' });
    expect(res.status).toBe(200);
    expect(res.body.pageTitle).toBe('Example');
    expect(res.body.violations).toHaveLength(1);
    expect(res.body.violations[0]).toMatchObject({
      ruleId: 'image-alt',
      impact: 'serious',
      html: '<img src="x" />',
    });
    expect(res.body.counts.total).toBe(1);
    expect(res.body.counts.serious).toBe(1);
  });

  it('maps timeouts to 504', async () => {
    vi.spyOn(scanService, 'scanUrl').mockRejectedValue(new Error('Navigation Timeout Exceeded'));
    const res = await request(app).post('/api/scan').send({ url: 'https://example.com' });
    expect(res.status).toBe(504);
  });

  it('maps navigation failures to 422', async () => {
    vi.spyOn(scanService, 'scanUrl').mockRejectedValue(new Error('net::ERR_NAME_NOT_RESOLVED'));
    const res = await request(app).post('/api/scan').send({ url: 'https://example.com' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/explain', () => {
  it('returns 400 when violation is missing', async () => {
    const res = await request(app).post('/api/explain').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/explain')
      .send({ violation: { ruleId: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required field');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
