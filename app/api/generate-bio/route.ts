import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { credentials, teacherName } = await request.json();

    if (!credentials || credentials.trim().length === 0) {
      return NextResponse.json(
        { error: 'Credentials are required' },
        { status: 400 }
      );
    }

    if (!teacherName || teacherName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Teacher name is required' },
        { status: 400 }
      );
    }

    const prompt = `You are a professional copywriter specializing in creating compelling biographies for music teachers. Based on the following teacher's name and credentials, create a marketable biography that will attract students and parents. The biography should be professional, engaging, and highlight the teacher's qualifications and unique approach to music education.

Teacher Name: ${teacherName}

Credentials and Information:
${credentials}

Please create a biography that:
- Uses the teacher's name (${teacherName}) throughout the biography
- Is professional and engaging
- Highlights qualifications and experience
- Shows personality and teaching philosophy
- Appeals to potential students and parents
- Is under 1000 characters
- Uses a warm, approachable tone
- Does not include a header or footer
- Writes in first person about ${teacherName}

Biography:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedBio = completion.choices[0]?.message?.content;

    if (!generatedBio) {
      return NextResponse.json(
        { error: 'Failed to generate biography' },
        { status: 500 }
      );
    }

    return NextResponse.json({ biography: generatedBio });
  } catch (error) {
    console.error('Error generating biography:', error);
    return NextResponse.json(
      { error: 'Failed to generate biography' },
      { status: 500 }
    );
  }
}
