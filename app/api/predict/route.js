import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    const { professorName, subject, reviews } = await req.json();

    if (!professorName || !subject || !reviews || !Array.isArray(reviews)) {
      return NextResponse.json({ 
        error: 'Missing required fields: professorName, subject, reviews' 
      }, { status: 400 });
    }

    return new Promise((resolve) => {
      // Create prediction script input
      const inputData = JSON.stringify({
        professor: professorName,
        subject: subject,
        reviews: reviews
      });

      // Run Python prediction script
      const pythonProcess = spawn('python3', [
        path.join(process.cwd(), 'predict_professor.py')
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      // Send input data to Python script
      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(NextResponse.json({ 
              success: true, 
              prediction: result
            }));
          } catch (parseError) {
            resolve(NextResponse.json({ 
              success: false, 
              error: 'Failed to parse prediction results',
              output: output
            }, { status: 500 }));
          }
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: 'Prediction failed',
            details: error,
            code: code
          }, { status: 500 }));
        }
      });

      // Set timeout for prediction (30 seconds)
      setTimeout(() => {
        pythonProcess.kill();
        resolve(NextResponse.json({ 
          success: false, 
          error: 'Prediction timeout after 30 seconds'
        }, { status: 408 }));
      }, 30000);
    });
  } catch (error) {
    console.error('Error in prediction:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process prediction request',
      details: error.message
    }, { status: 500 });
  }
}
