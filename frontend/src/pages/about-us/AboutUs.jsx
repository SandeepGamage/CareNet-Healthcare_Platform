import React from 'react';
import Navbar from '../../components/common/Navbar';
import { HeartPulse } from 'lucide-react';
import AboutUs1 from '../../assets/AboutUs1.jpg';
import AboutUs2 from '../../assets/AboutUs2.jpg';
import AboutUs3 from '../../assets/AboutUs3.jpg';
import AboutUs4 from '../../assets/AboutUs4.jpg';
import AboutUs5 from '../../assets/AboutUs5.jpg';
import AboutUs6 from '../../assets/AboutUs6.jpg';

export default function AboutUs() {
	return (
		<>
			<Navbar title="About Us" />
			<div className="min-h-screen pt-24 bg-gradient-to-br from-teal-50 via-white to-blue-50">
				<div className="container mx-auto px-4 py-12 max-w-7xl">
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg mb-4">
							<HeartPulse className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-4xl font-bold text-gray-900 mb-2">Empowering insights, elevating decisions</h1>
						<p className="text-gray-600 max-w-2xl mx-auto">We turn complex data into real-time insights, helping providers deliver better care and patients make smarter choices about their health.</p>
					</div>

					<div className="mb-10">
							<img
								className="w-full h-96 md:h-[36rem] rounded-2xl object-cover object-center shadow-lg"
								src={AboutUs1}
								alt="Care team"
							/>
						</div>

					<div className="bg-white rounded-2xl p-8 shadow-lg">
						<div className="mb-8">
							<h3 className="text-2xl font-semibold mb-2">Our mission & vision.</h3>
							<p className="text-gray-600">Driving growth through data intelligence.</p>
						</div>

						<div className="grid md:grid-cols-2 gap-8">
							<div className="bg-slate-50 rounded-lg overflow-hidden shadow-sm">
								<img className="w-full h-56 md:h-64 object-cover" src={AboutUs3} alt="Mission" />
								<div className="p-6">
									<h4 className="font-semibold mb-2">Mission</h4>
									<p className="text-gray-600 text-sm">Empowering individuals with accessible, secure, and easy-to-use healthcare tools that simplify booking, consultations, and follow-up care.</p>
								</div>
							</div>

							<div className="bg-slate-50 rounded-lg overflow-hidden shadow-sm">
								<img className="w-full h-56 md:h-64 object-cover" src={AboutUs2} alt="Vision" />
								<div className="p-6">
									<h4 className="font-semibold mb-2">Vision</h4>
									<p className="text-gray-600 text-sm">Transforming healthcare delivery with AI-driven insights, secure telemedicine, and seamless patient-provider collaboration.</p>
								</div>
							</div>
						</div>

						<hr className="my-6" />

						<h3 className="text-xl font-semibold mb-2">The foundation of our success.</h3>
						<p className="text-gray-600 mb-6">Driving innovation & integrity.</p>

						<div className="grid gap-6">
							<div className="grid md:grid-cols-2 gap-6 mb-6">
								<div className="relative rounded-lg overflow-hidden shadow-sm h-52 md:h-56">
									<img src={AboutUs4} alt="Innovation" className="absolute inset-0 w-full h-full object-cover" />
									<div className="relative z-10 p-6 flex gap-4 items-start">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-slate-200 font-bold text-sm">1</div>
										<div>
											<h5 className="font-semibold mb-1 text-black">Innovation</h5>
											<p className="text-sm text-gray-800">We embrace creativity to drive progress.</p>
										</div>
									</div>
								</div>

								<div className="relative rounded-lg overflow-hidden shadow-sm h-52 md:h-56">
									<img src={AboutUs5} alt="Excellence" className="absolute inset-0 w-full h-full object-cover" />
									<div className="relative z-10 p-6 flex gap-4 items-start">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-slate-200 font-bold text-sm">2</div>
										<div>
											<h5 className="font-semibold mb-1 text-black">Excellence</h5>
											<p className="text-sm text-gray-800">We strive for the highest quality in our work.</p>
										</div>
									</div>
								</div>
							</div>

							<div className="relative rounded-lg overflow-hidden shadow-sm h-60 md:h-72 flex flex-col md:flex-row items-start">
								<img src={AboutUs6} alt="Collaboration" className="absolute inset-0 w-full h-full object-cover" />
								<div className="relative z-10 p-6 md:w-2/3">
									<div className="flex gap-4 items-start">
										<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-slate-200 font-bold text-sm">3</div>
										<div>
											<h5 className="font-semibold mb-2">Collaboration</h5>
											<p className="text-sm text-gray-600">We succeed together through teamwork and trust.</p>
										</div>
									</div>
								</div>
							</div>
						</div>


					</div>
				</div>
			</div>
		</>
	);
}
