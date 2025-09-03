import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: '没有提供文件' },
                { status: 400 }
            );
        }

        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: '不支持的文件格式。支持的格式：JPEG, PNG, GIF, BMP, TIFF, WebP' },
                { status: 400 }
            );
        }

        // 检查文件大小 (限制为 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: '文件大小不能超过 10MB' },
                { status: 400 }
            );
        }

        // 将文件转换为 Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // 使用 Sharp 转换为 WebP
        const webpBuffer = await sharp(buffer)
            .webp({
                quality: 85,
                effort: 4
            })
            .toBuffer();

        // 生成文件名
        const originalName = file.name.split('.')[0] || 'converted';
        const filename = `${originalName}.webp`;

        // 返回转换后的文件
        return new NextResponse(webpBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/webp',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': webpBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('转换过程中发生错误:', error);
        return NextResponse.json(
            { error: '图片转换失败，请稍后重试' },
            { status: 500 }
        );
    }
}
