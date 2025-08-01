import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all posts with their author information
    // const posts = await prisma.post.findMany({
    //   include: {
    //     author: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // });

    return NextResponse.json({ posts: [] });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, published, authorId } = body;

    // Validate required fields
    if (!title || !authorId) {
      return NextResponse.json(
        { error: 'Title and authorId are required' },
        { status: 400 }
      );
    }

    // Create new post
    // const post = await prisma.post.create({
    //   data: {
    //     title,
    //     content: content || '',
    //     published: published || false,
    //     authorId,
    //   },
    //   include: {
    //     author: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true,
    //       },
    //     },
    //   },
    // });

    return NextResponse.json({ post: { id: '1', title, content, published, authorId } }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
