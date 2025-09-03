import Link from "next/link";
import { ImageIcon, Zap, Shield, Globe } from "lucide-react";

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<div className="text-center">
					<h1 className="font-extrabold text-5xl text-gray-900 tracking-tight sm:text-[5rem] mb-6">
						Web <span className="text-blue-600">工具集</span>
					</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						提供各种实用的在线工具，帮助您提高工作效率
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
					<Link
						className="flex flex-col gap-4 rounded-xl bg-white shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
						href="/image-converter"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 rounded-lg">
								<ImageIcon className="w-6 h-6 text-blue-600" />
							</div>
							<h3 className="font-bold text-xl text-gray-900">批量图片转 WebP</h3>
						</div>
						<div className="text-gray-600">
							支持批量上传和转换多个图片文件为 WebP 格式，减小文件大小，提升网页加载速度。支持单独下载或批量下载。
						</div>
						<div className="flex items-center gap-2 text-sm text-blue-600">
							<Zap className="w-4 h-4" />
							<span>批量高性能转换</span>
						</div>
					</Link>

					<div className="flex flex-col gap-4 rounded-xl bg-gray-50 shadow-lg p-6 border border-gray-200 opacity-60">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-gray-100 rounded-lg">
								<Shield className="w-6 h-6 text-gray-400" />
							</div>
							<h3 className="font-bold text-xl text-gray-500">更多工具</h3>
						</div>
						<div className="text-gray-500">
							更多实用工具正在开发中...
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-400">
							<Globe className="w-4 h-4" />
							<span>即将推出</span>
						</div>
					</div>

					<div className="flex flex-col gap-4 rounded-xl bg-gray-50 shadow-lg p-6 border border-gray-200 opacity-60">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-gray-100 rounded-lg">
								<Shield className="w-6 h-6 text-gray-400" />
							</div>
							<h3 className="font-bold text-xl text-gray-500">敬请期待</h3>
						</div>
						<div className="text-gray-500">
							我们正在不断添加新的工具...
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-400">
							<Globe className="w-4 h-4" />
							<span>持续更新</span>
						</div>
					</div>
				</div>

				<div className="text-center max-w-3xl">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">为什么选择我们的工具？</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-blue-100 rounded-full">
								<Zap className="w-6 h-6 text-blue-600" />
							</div>
							<h3 className="font-semibold text-gray-900">高性能处理</h3>
							<p className="text-sm text-gray-600">采用 Sharp 库，提供业界最快的图片处理速度</p>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-green-100 rounded-full">
								<Shield className="w-6 h-6 text-green-600" />
							</div>
							<h3 className="font-semibold text-gray-900">安全可靠</h3>
							<p className="text-sm text-gray-600">本地处理，不上传到服务器，保护您的隐私</p>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="p-3 bg-purple-100 rounded-full">
								<Globe className="w-6 h-6 text-purple-600" />
							</div>
							<h3 className="font-semibold text-gray-900">免费使用</h3>
							<p className="text-sm text-gray-600">完全免费，无需注册，随时可用</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
