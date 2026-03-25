import { CheckIcon } from "@heroicons/react/20/solid";

export default function PromotionCard() {
  return (
    <div className="isolate overflow-hidden rounded-lg bg-white w-[15rem] h-[20rem] p-4">
      <div className="text-center mb-4">
        <span className="bg-[#2EB966]/10 text-[#2EB966] text-sm font-semibold px-3 py-1 rounded-full">
          New Customer Special
        </span>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="text-4xl font-bold text-[#2EB966]">$35</div>
        <span className="text-sm mt-3 text-gray-500">/first service</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start">
          <CheckIcon className="h-5 w-5 text-[#2EB966] mt-0.5" />
          <span className="ml-2 text-sm text-gray-600">Professional lawn mowing service</span>
        </div>
        <div className="flex items-start">
          <CheckIcon className="h-5 w-5 text-[#2EB966] mt-0.5" />
          <span className="ml-2 text-sm text-gray-600">Includes edging and blowing</span>
        </div>
        <div className="flex items-start">
          <CheckIcon className="h-5 w-5 text-[#2EB966] mt-0.5" />
          <span className="ml-2 text-sm text-gray-600">Satisfaction guaranteed</span>
        </div>
        <div className="flex items-start">
          <CheckIcon className="h-5 w-5 text-[#2EB966] mt-0.5" />
          <span className="ml-2 text-sm text-gray-600">No contract required</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-center text-gray-500">
        *Valid for lawns up to 1/4 acre
      </div>
    </div>
  );
}
