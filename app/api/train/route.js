import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    return new Promise((resolve) => {
      // Run the Python training script
      const pythonProcess = spawn('python3', [
        path.join(process.cwd(), 'train_model.py')
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Training output:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error('Training error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            message: 'Model training completed successfully',
            output: output
          }));
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: 'Training failed',
            details: error,
            code: code
          }, { status: 500 }));
        }
      });

      // Set timeout for training (10 minutes)
      setTimeout(() => {
        pythonProcess.kill();
        resolve(NextResponse.json({ 
          success: false, 
          error: 'Training timeout after 10 minutes'
        }, { status: 408 }));
      }, 600000);
    });
  } catch (error) {
    console.error('Error starting training:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to start training process',
      details: error.message
    }, { status: 500 });
  }
}
