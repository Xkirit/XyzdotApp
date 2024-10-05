import { NextResponse, NextRequest } from 'next/server';
import { validateRequest } from "@/auth";
import { getPostDataInclude } from '@/lib/types';
import prisma from '@/lib/prisma';
import { PostsPage } from '@/lib/types';
export async function GET(req: NextRequest){
  try {
    const cursor= req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize= 10;
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where:{
        user:{
          followers: {
            some:{
              followerId: user.id
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: getPostDataInclude(user.id),

    })
    const nextCursor= posts.length > pageSize ? posts[pageSize].id :null;

    const data: PostsPage={
      posts: posts.slice(0, pageSize),
      nextCursor,
    }    

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}