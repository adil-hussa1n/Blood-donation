import { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';

export async function submitSupportRequest(req: Request, res: Response): Promise<void> {
  const { type, name, phone, issue_type, message } = req.body;

  try {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO support_requests (id, type, name, phone, issue_type, message) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, type || 'support', name, phone, issue_type || null, message]
    );

    res.status(201).json({ success: true, error: null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
}

export async function getSupportRequests(req: Request, res: Response): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, type, name, phone, issue_type, message, created_at FROM support_requests ORDER BY created_at DESC'
    );
    res.json({ data: rows, error: null });
  } catch (error: any) {
    res.status(500).json({ data: [], error: { message: error.message } });
  }
}
